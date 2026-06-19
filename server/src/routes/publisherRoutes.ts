import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import prisma from '../db/prismaClient';

const router = Router();

const PublisherMatchSchema = z.object({
  cohortToken: z.string().min(1),
  publisherId: z.string().min(1),
  inventoryType: z.enum(['display', 'video', 'native', 'ctvv']),
  floorCPM: z.number().positive(),
});

/**
 * AAMP Endpoint: POST /publisher/match
 * Publisher Agents call this to match a Brand's active cohort token
 * against available inventory and determine if a bid should be placed.
 */
router.post('/match', async (req: Request, res: Response): Promise<void> => {
  const parsed = PublisherMatchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
    return;
  }
  const { cohortToken, publisherId, inventoryType, floorCPM } = parsed.data;

  try {
    // 1. Verify the brand's token is still ACTIVE
    const tokenRecord = await prisma.consentToken.findUnique({ where: { token: cohortToken } });
    if (!tokenRecord || tokenRecord.status !== 'ACTIVE') {
      res.status(403).json({ matched: false, reason: 'TOKEN_INVALID_OR_REVOKED' });
      return;
    }

    // 2. Simulate publisher inventory matching logic
    // In production: query AltaStata-encrypted publisher inventory datasets
    const matchScore = Math.random(); // Simulated 0–1 relevance score
    const estimatedCPM = floorCPM * (1 + matchScore * 2); // Bid between 1x–3x floor
    const impressionId = `imp_${randomUUID().substring(0, 10)}`;

    // 3. Log to immutable ledger
    await prisma.ledgerEntry.create({
      data: {
        action: 'AAMP_PUBLISHER_MATCH',
        brandId: tokenRecord.brandId,
        tokenRef: cohortToken,
        auditHash: impressionId,
      },
    });

    if (matchScore < 0.15) {
      // Simulate no-bid scenario (~15% of the time)
      res.status(200).json({ matched: false, reason: 'BELOW_RELEVANCE_THRESHOLD', matchScore });
      return;
    }

    res.status(200).json({
      matched: true,
      impressionId,
      publisherId,
      inventoryType,
      estimatedCPM: Math.round(estimatedCPM * 100) / 100,
      matchScore: Math.round(matchScore * 100) / 100,
      cohortId: tokenRecord.cohortId,
    });
  } catch (error) {
    console.error('[Publisher] Match error:', error);
    res.status(500).json({ error: 'Publisher matching failed' });
  }
});

/**
 * GET /publisher/inventory
 * Returns simulated publisher inventory slots available for activation.
 */
router.get('/inventory', (_req: Request, res: Response) => {
  res.json([
    { slotId: 'slot_001', publisherId: 'guardian_uk', type: 'display', format: '300x250', floorCPM: 1.20 },
    { slotId: 'slot_002', publisherId: 'the_times',   type: 'video',   format: '15s pre-roll', floorCPM: 4.50 },
    { slotId: 'slot_003', publisherId: 'ft_digital',  type: 'native',  format: 'in-feed',     floorCPM: 2.00 },
    { slotId: 'slot_004', publisherId: 'sky_sports',  type: 'ctv',     format: '30s mid-roll', floorCPM: 8.00 },
  ]);
});

export default router;
