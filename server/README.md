# Data Aura — Trust Layer Backend

Node.js + Express + TypeScript backend implementing the **IAB Tech Lab AAMP 2.0** protocol with an **AltaStata + Confidential Computing** clean room architecture.

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript (ts-node) |
| Framework | Express 5 |
| Database | SQLite via Prisma ORM |
| Validation | Zod |
| Clean Room | AltaStata Simulation (Confidential Computing Enclave) |
| Privacy | Laplace Differential Privacy (ε-configurable) |

## Getting Started

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

The server runs on `http://localhost:3001`.

## API Reference

### AAMP Standard Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/aamp/audience/request` | Brand Agent requests a DP-safe audience cohort via AltaStata enclave |
| `POST` | `/api/v1/aamp/consent/verify` | Publisher/Measurement Agent verifies a token is active |
| `POST` | `/api/v1/aamp/incentive/payout` | Brand initiates wallet reward payout to consumer |

### Publisher Agent Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/publisher/match` | Match a brand cohort token against publisher inventory |
| `GET` | `/api/v1/publisher/inventory` | List available publisher inventory slots |

### Consumer / Trust Layer Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/consumer/consent` | Get consumer's current consent settings |
| `PUT` | `/api/v1/consumer/consent` | Toggle consent for a brand/category (auto-revokes tokens if disabled) |
| `POST` | `/api/v1/consumer/revoke` | Immediately revoke all tokens for a brand |
| `GET` | `/api/v1/consumer/wallet` | Get consumer wallet balance and transaction history |
| `POST` | `/api/v1/consumer/wallet/credit` | Credit consumer wallet (triggered by brand payout) |

### Admin Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/ledger` | Get immutable audit ledger (supports `?brandId=&limit=` filtering) |
| `GET` | `/health` | Health check with DB statistics |

## Architecture

### AltaStata Confidential Clean Room

```
Brand Agent Request
      │
      ▼
 AAMP API (Express)
      │
      ▼
 Consent Check (SQLite)
      │
      ▼
 AltaStata Enclave Simulation
 ├── Fetch encrypted Parquet (S3)
 ├── In-memory decryption
 ├── Cohort intersection
 ├── Guardrail: min cohort size = 50
 └── Differential Privacy (Laplace ε)
      │
      ▼
 Issue AAMP Token → SQLite
 Write to Immutable Ledger → SQLite
      │
      ▼
 Return: { cohortToken, audienceSize, noiseApplied, auditHash }
```

### Privacy Guardrails

- **Minimum Cohort Size**: Rejects queries where the raw match count < 50 (IAB ARTF requirement)
- **Differential Privacy**: Laplace noise applied with configurable ε (default ε=0.1, strict)
- **Token Expiry**: Active tokens automatically EXPIRED after 24 hours (GC runs every 60s)
- **Consent Revocation**: Consumer toggling a brand off immediately invalidates all ACTIVE tokens

## Database Schema

- **ConsentToken**: AAMP permission tokens (ACTIVE / REVOKED / EXPIRED)
- **LedgerEntry**: Immutable append-only audit log
- **ConsentSetting**: Consumer consent toggles per brand/category
- **WalletTransaction**: Consumer reward payout history
