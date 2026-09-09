# Support Buddy Demo Product

A fictional SaaS platform monorepo that serves as the **target codebase** for [The Support Buddy X9000](https://github.com/Trevorton27/The-Support-Buddy-X9000) — an AI-powered support operations platform with autonomous bug reproduction and fixing via [Devin AI](https://devin.ai).

## What is this?

The Support Buddy X9000 investigates support tickets using a multi-agent AI pipeline. When a ticket describes a bug, the platform can dispatch Devin AI to **reproduce** the bug and **submit a fix** as a pull request — all without a human writing code.

This repository is the fictional product that customers are filing tickets about. It contains **real, runnable TypeScript services** with **deliberately seeded defects** that match the support scenarios in The Support Buddy X9000's demo data.

## How it fits together

```
Customer files ticket
        |
        v
┌─────────────────────────────────┐
│   The Support Buddy X9000       │
│                                 │
│   1. AI investigates ticket     │
│   2. Identifies root cause      │
│   3. Drafts customer reply      │
│   4. Human reviews & approves   │
│   5. Dispatches Devin AI ───────┼──► This repo
│                                 │      │
│   6. Devin reproduces bug       │◄─────┘
│   7. Devin submits PR fix       │
│   8. Human reviews & merges     │
└─────────────────────────────────┘
```

## Services

| Service | Version | Description | Seeded Defect |
|---------|---------|-------------|---------------|
| **auth-service** | v1.9.5 | SAML SSO, JWT tokens, session management | Certificate selection ignores region — EU users get US cert, causing signature validation failures |
| **auth-service** | v1.9.5 | *(same service, second defect)* | Session context not invalidated on org switch — stale organization data returned |
| **order-service** | v2.4.1 | Order processing, `/v2/orders` API | Query timeout hardcoded to 3000ms, ignores configurable 10000ms value from deployment |
| **webhook-dispatcher** | v3.1.2 | Outbound webhook delivery + HMAC signatures | Only checks new `X-Signature-256` header, ignores legacy `X-Webhook-Sig` — 30% of customers fail |
| **billing-service** | v4.0.3 | API key management, payment processing | `isKeyActive` rejects pending keys during async propagation window — 401s after rotation |
| **rate-limiter** | v2.2.0 | Token bucket rate limiting with burst protection | Burst requests charged at `burstMultiplier` rate each instead of 1 — limits hit at ~20% of capacity |
| **database-client** | v1.21.0 | Shared connection pool wrapper | Pool size calculation ignores instance count — 20 instances × 25 pool = 500, exceeding 100 DB limit |

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests (expect 11 failures — these are the seeded bugs)
npm test

# Run a specific service's tests
npm run test:auth
npm run test:webhook
npm run test:order
npm run test:billing
npm run test:rate-limiter
npm run test:database
```

### Expected test output

```
Test Files  7 failed | 1 passed (8)
     Tests  11 failed | 21 passed (32)
```

The 11 failing tests are intentional — they prove the seeded bugs exist. When Devin (or a developer) fixes a bug, its corresponding tests will pass.

## Defect anatomy

Each seeded defect follows the same pattern:

1. **Source file** — Contains real business logic with a subtle, realistic bug
2. **Failing test** — Proves the bug exists and describes the expected behavior
3. **Narrow fix** — Typically 1–5 lines of code to resolve
4. **Matching support ticket** — A corresponding ticket in The Support Buddy X9000 demo data
5. **Matching deployment** — A deployment record that correlates with the defect

### Example: Webhook signature verification

**The bug** (`services/webhook-dispatcher/src/middleware/signatureVerifier.ts`):
```typescript
// After v3.1.2 deployment, only checks the new header name.
// Customers still sending X-Webhook-Sig get "header not present" errors.
const signature = request.headers["x-signature-256"];
```

**The fix**:
```typescript
const signature = request.headers["x-signature-256"] ?? request.headers["x-webhook-sig"];
```

**The failing test** (`services/webhook-dispatcher/tests/signature-verifier.test.ts`):
```typescript
it("should verify signature with legacy X-Webhook-Sig header", () => {
  const sig = makeSignature(BODY, SECRET);
  const result = verifyWebhookSignature(
    { headers: { "x-webhook-sig": sig }, body: BODY },
    SECRET
  );
  expect(result.valid).toBe(true); // FAILS — returns false
});
```

**The matching ticket** (TKT-004 in Support Buddy):
> "Webhook events not being delivered — 30% failure rate. Error in our logs: 'HMAC header X-Webhook-Sig not present'."

**The matching deployment** (deploy_004):
> "webhook-dispatcher v3.1.2 — Signature header name changed from X-Webhook-Sig to X-Signature-256"

## Bug Generator

The Support Buddy X9000 includes a **Bug Generator** feature (`/bug-generator` in the dashboard) that can:

- **Inject** a bug — replaces the fixed code with the buggy version in this repo
- **Inject + Create Ticket** — same as above, plus creates a matching support ticket
- **Revert** — replaces the buggy code with the correct fix (for resetting after Devin fixes it)

This enables a repeatable testing loop:

```
1. Revert all fixes (clean state)
2. Inject a bug via Bug Generator
3. Auto-create a matching support ticket
4. Run an AI investigation on the ticket
5. Dispatch Devin to reproduce the bug
6. Dispatch Devin to submit a fix PR
7. Review and merge the PR
8. Repeat with a different bug
```

## Connecting to Support Buddy

Set these environment variables in The Support Buddy X9000's `.env.local`:

```bash
# Path to this repo on disk (for Bug Generator file operations)
DEMO_PRODUCT_REPO_PATH=/path/to/support-buddy-demo-product

# GitHub URL (for Devin to clone and work against)
DEVIN_DEFAULT_REPO=https://github.com/Trevorton27/support-buddy-demo-product
```

## Repository structure

```
support-buddy-demo-product/
├── services/
│   ├── auth-service/
│   │   ├── src/
│   │   │   ├── saml/validator.ts          ← cert region bug
│   │   │   └── session/context.ts         ← stale org context bug
│   │   └── tests/
│   ├── order-service/
│   │   ├── src/handlers/orderHandler.ts   ← hardcoded timeout bug
│   │   └── tests/
│   ├── webhook-dispatcher/
│   │   ├── src/middleware/signatureVerifier.ts  ← legacy header bug
│   │   └── tests/
│   ├── billing-service/
│   │   ├── src/keys/keyManager.ts         ← key propagation bug
│   │   └── tests/
│   ├── rate-limiter/
│   │   ├── src/tokenBucket.ts             ← burst double-count bug
│   │   └── tests/
│   └── database-client/
│       ├── src/poolCalculator.ts           ← pool scaling bug
│       └── tests/
├── packages/
│   └── shared-config/                     ← shared TypeScript types
├── AGENTS.md                              ← instructions for Devin AI
├── package.json
└── tsconfig.json
```

## License

This repository is a demo fixture — it is not a real product and has no license for production use.
