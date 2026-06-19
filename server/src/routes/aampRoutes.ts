import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { executeCleanRoomQuery, EnclaveQuery } from '../cleanroom/altaStataRuntime';
import prisma from '../db/prismaClient';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev-only-do-not-use-in-prod';

// --- Zod Input Validation Schemas ---
const AudienceRequestSchema = z.object({
  brandId: z.string().min(1),
  targetCategory: z.string().min(1),
  requestedEpsilon: z.number().min(0.01).max(10.0).optional().default(0.1),
});

const ConsentVerifySchema = z.object({
  token: z.string().min(1),
  action: z.string().min(1),
});

const IncentivePayoutSchema = z.object({
  token: z.string().min(1),
  amount: z.number().positive(),
});

/**
 * AAMP Endpoint: POST /audience/request
 * Brand Agents call this to request a privacy-safe audience cohort.
 * Triggers the AltaStata Confidential Enclave execution.
 */
router.post('/audience/request', async (req: Request, res: Response): Promise<void> => {
  const parsed = AudienceRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
    return;
  }
  const { brandId, targetCategory, requestedEpsilon } = parsed.data;

  try {
    // Check if consumer globally paused sharing for this brand/category
    const consent = await prisma.consentSetting.findFirst({
      where: { brandId, category: targetCategory },
    });

    if (consent && !consent.enabled) {
      await prisma.ledgerEntry.create({
        data: {
          action: 'AAMP_AUDIENCE_REQUEST_BLOCKED',
          brandId,
          auditHash: 'CONSENT_REVOKED',
        },
      });
      res.status(403).json({ error: 'Consent previously revoked by consumer' });
      return;
    }

    const query: EnclaveQuery = {
      brandId,
      targetCategory,
      minCohortSize: 50,
      epsilon: requestedEpsilon,
      encryptedDatasetUris: [
        `s3://altastata-vault/consumer_data_${targetCategory}.parquet`,
        `s3://altastata-vault/brand_seed_${brandId}.parquet`,
      ],
    };

    const result = await executeCleanRoomQuery(query);

    if (result.status === 'BLOCKED_BY_GUARDRAIL') {
      // Still log the blocked attempt
      await prisma.ledgerEntry.create({
        data: {
          action: 'AAMP_AUDIENCE_REQUEST_BLOCKED',
          brandId,
          auditHash: 'BLOCKED',
        },
      });
      res.status(403).json({ error: 'Privacy Guardrail Triggered', reason: result.reason });
      return;
    }

    // Issue persistent AAMP-compliant signed JWT token
    const token = jwt.sign(
      { brandId, cohortId: result.cohortId },
      JWT_SECRET,
      { expiresIn: '24h', jwtid: randomUUID() }
    );
    await prisma.consentToken.create({
      data: { token, brandId, cohortId: result.cohortId, status: 'ACTIVE' },
    });

    // Write to persistent immutable ledger
    await prisma.ledgerEntry.create({
      data: {
        action: 'AAMP_AUDIENCE_REQUEST',
        brandId,
        auditHash: result.auditHash,
        audienceSize: result.aggregatedMatchSize,
        tokenRef: token,
      },
    });

    res.status(200).json({
      cohortToken: token,
      audienceSize: result.aggregatedMatchSize,
      noiseApplied: result.noiseApplied,
      auditHash: result.auditHash,
    });
  } catch (error) {
    console.error('[AAMP] Audience request error:', error);
    res.status(500).json({ error: 'Internal Clean Room Error' });
  }
});

/**
 * AAMP Endpoint: POST /consent/verify
 * Publisher & Measurement Agents verify a token is active and consent is valid.
 */
router.post('/consent/verify', async (req: Request, res: Response): Promise<void> => {
  const parsed = ConsentVerifySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
    return;
  }
  const { token, action } = parsed.data;

  // 1. Verify JWT signature natively
  try {
    jwt.verify(token, JWT_SECRET);
  } catch (err) {
    res.status(403).json({ valid: false, reason: 'TOKEN_SIGNATURE_INVALID_OR_EXPIRED' });
    return;
  }

  // 2. Check token against database registry
  const tokenRecord = await prisma.consentToken.findUnique({ where: { token } });

  if (!tokenRecord) {
    res.status(404).json({ valid: false, reason: 'TOKEN_NOT_FOUND' });
    return;
  }
  if (tokenRecord.status === 'REVOKED') {
    res.status(403).json({ valid: false, reason: 'TOKEN_REVOKED_BY_CONSUMER' });
    return;
  }
  if (tokenRecord.status === 'EXPIRED') {
    res.status(403).json({ valid: false, reason: 'TOKEN_EXPIRED' });
    return;
  }

  await prisma.ledgerEntry.create({
    data: { action: `AAMP_CONSENT_VERIFY_${action}`, brandId: tokenRecord.brandId, tokenRef: token },
  });

  res.status(200).json({ valid: true, cohortId: tokenRecord.cohortId });
});

/**
 * AAMP Endpoint: POST /incentive/payout
 * Brand Agents initiate reward payout to the consumer's wallet.
 */
router.post('/incentive/payout', async (req: Request, res: Response): Promise<void> => {
  const parsed = IncentivePayoutSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
    return;
  }
  const { token, amount } = parsed.data;

  const tokenRecord = await prisma.consentToken.findUnique({ where: { token } });
  if (!tokenRecord || tokenRecord.status !== 'ACTIVE') {
    res.status(403).json({ success: false, error: 'Invalid or revoked token' });
    return;
  }

  const txId = `tx_${randomUUID()}`;
  await prisma.ledgerEntry.create({
    data: { action: 'AAMP_INCENTIVE_PAYOUT', brandId: tokenRecord.brandId, amount, tokenRef: token },
  });

  res.status(200).json({ success: true, transactionId: txId });
});

export default router;
