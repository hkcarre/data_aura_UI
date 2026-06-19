import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { z } from 'zod';
import aampRoutes from './routes/aampRoutes';
import publisherRoutes from './routes/publisherRoutes';
import prisma from './db/prismaClient';
import { randomUUID } from 'crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================
// Middleware
// ============================================================
app.use(cors());
app.use(express.json());

// ============================================================
// AAMP Standard Protocol Routes
// ============================================================
app.use('/api/v1/aamp', aampRoutes);

// ============================================================
// Publisher Agent Routes
// ============================================================
app.use('/api/v1/publisher', publisherRoutes);

// ============================================================
// Audit Ledger — GET all entries (for Admin Portal)
// ============================================================
app.get('/api/v1/ledger', async (req: Request, res: Response) => {
  try {
    const { brandId, limit } = req.query;
    const entries = await prisma.ledgerEntry.findMany({
      where: brandId ? { brandId: String(brandId) } : undefined,
      orderBy: { timestamp: 'desc' },
      take: limit ? Math.min(Number(limit), 500) : 100,
    });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ledger' });
  }
});

// ============================================================
// Consumer Consent — GET current settings
// ============================================================
app.get('/api/v1/consumer/consent', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || 'consumer_001';
    const settings = await prisma.consentSetting.findMany({ where: { userId } });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch consent settings' });
  }
});

// ============================================================
// Consumer Consent — PUT (upsert) a toggle + auto-revoke
// ============================================================
const ConsentToggleSchema = z.object({
  userId: z.string().optional().default('consumer_001'),
  brandId: z.string().min(1),
  category: z.string().min(1),
  enabled: z.boolean(),
});

app.put('/api/v1/consumer/consent', async (req: Request, res: Response) => {
  const parsed = ConsentToggleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
    return;
  }
  const { userId, brandId, category, enabled } = parsed.data;

  try {
    const setting = await prisma.consentSetting.upsert({
      where: { userId_brandId_category: { userId, brandId, category } },
      update: { enabled },
      create: { userId, brandId, category, enabled },
    });

    if (!enabled) {
      const revokedTokens = await prisma.consentToken.updateMany({
        where: { brandId, status: 'ACTIVE' },
        data: { status: 'REVOKED' },
      });
      await prisma.ledgerEntry.create({
        data: { action: 'CONSUMER_CONSENT_REVOKED', brandId, auditHash: `revoked_${revokedTokens.count}_tokens` },
      });
      res.json({ setting, revokedTokens: revokedTokens.count });
      return;
    }

    await prisma.ledgerEntry.create({
      data: { action: 'CONSUMER_CONSENT_GRANTED', brandId },
    });
    res.json({ setting, revokedTokens: 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update consent setting' });
  }
});

// ============================================================
// Consumer Revoke — POST by brandId (direct revocation)
// ============================================================
app.post('/api/v1/consumer/revoke', async (req: Request, res: Response) => {
  const { brandId } = req.body;
  if (!brandId) { res.status(400).json({ error: 'brandId is required' }); return; }

  try {
    const result = await prisma.consentToken.updateMany({
      where: { brandId, status: 'ACTIVE' },
      data: { status: 'REVOKED' },
    });
    await prisma.ledgerEntry.create({
      data: { action: 'CONSUMER_REVOKE_ALL_TOKENS', brandId, auditHash: `revoked_${result.count}_tokens` },
    });
    res.json({ success: true, message: `Revoked ${result.count} active tokens for ${brandId}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to revoke tokens' });
  }
});

// ============================================================
// Consumer Wallet — GET balance and transactions
// ============================================================
app.get('/api/v1/consumer/wallet', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || 'consumer_001';
    const transactions = await prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    const balance = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    res.json({ balance: Math.round(balance * 100) / 100, transactions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wallet' });
  }
});

// ============================================================
// Consumer Wallet — POST payout (brand pays consumer)
// ============================================================
const WalletPayoutSchema = z.object({
  userId: z.string().optional().default('consumer_001'),
  brandId: z.string().min(1),
  amount: z.number().positive(),
});

app.post('/api/v1/consumer/wallet/credit', async (req: Request, res: Response) => {
  const parsed = WalletPayoutSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid input' }); return; }
  const { userId, brandId, amount } = parsed.data;

  try {
    const txId = `tx_${randomUUID()}`;
    await prisma.walletTransaction.create({
      data: { userId, brandId, amount, transactionId: txId },
    });
    await prisma.ledgerEntry.create({
      data: { action: 'CONSUMER_WALLET_CREDIT', brandId, amount },
    });
    res.json({ success: true, transactionId: txId, amount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to credit wallet' });
  }
});

// ============================================================
// Token Expiry — cleanup job (runs every 60s)
// Marks tokens older than 24h as EXPIRED
// ============================================================
async function expireOldTokens() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const expired = await prisma.consentToken.updateMany({
    where: { status: 'ACTIVE', issuedAt: { lt: cutoff } },
    data: { status: 'EXPIRED' },
  });
  if (expired.count > 0) {
    console.log(`[Token GC] Expired ${expired.count} tokens older than 24h`);
  }
}
setInterval(expireOldTokens, 60_000);

// ============================================================
// Health Check — with DB statistics
// ============================================================
app.get('/health', async (req: Request, res: Response) => {
  try {
    const [tokenCount, ledgerCount, consentCount, walletCount] = await Promise.all([
      prisma.consentToken.count(),
      prisma.ledgerEntry.count(),
      prisma.consentSetting.count(),
      prisma.walletTransaction.count(),
    ]);
    res.json({
      status: 'OK',
      architecture: 'AltaStata Confidential Computing',
      db: 'SQLite (Prisma)',
      tokens: tokenCount,
      ledgerEntries: ledgerCount,
      consentSettings: consentCount,
      walletTransactions: walletCount,
    });
  } catch (err) {
    res.status(500).json({ status: 'DEGRADED', error: 'DB unavailable' });
  }
});

// ============================================================
// Global Error Handler
// ============================================================
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ============================================================
// 404 Handler
// ============================================================
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ============================================================
// Graceful Shutdown
// ============================================================
process.on('SIGINT', async () => {
  console.log('\n[Data Aura] Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`[Data Aura Trust Layer] Running on http://localhost:${PORT}`);
  console.log(`[Data Aura Trust Layer] DB: SQLite via Prisma`);
  console.log(`[Data Aura Trust Layer] Token GC: active (24h expiry)`);
});
