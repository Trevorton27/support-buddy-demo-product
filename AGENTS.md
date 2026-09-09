# Support Buddy Demo Product — Agent Instructions

This is a fictional SaaS platform monorepo used for automated testing with Devin AI.

## Repository Structure

```
services/
  auth-service/         — SAML SSO, JWT, session management
  order-service/        — Order processing, /v2/orders API
  webhook-dispatcher/   — Outbound webhook delivery + signature verification
  billing-service/      — API key management, payment processing
  rate-limiter/         — Token bucket rate limiting with burst protection
  database-client/      — Shared connection pool wrapper
packages/
  shared-config/        — Shared types and configuration
```

## Running Tests

```bash
npm install
npm test                    # run all service tests
npm run test:auth           # auth-service only
npm run test:webhook        # webhook-dispatcher only
```

Each service uses **vitest** for testing.

## Bug Reproduction Guidelines

When reproducing a bug:
1. Read the relevant service's `src/` and `tests/` directories
2. Run the existing tests to confirm failures
3. The failing test describes the expected behavior
4. The fix should be minimal — typically 1-5 lines

## Known Defect Areas

- `auth-service`: Certificate/region selection, session context handling
- `webhook-dispatcher`: Signature verification, header compatibility
- `order-service`: Query timeout handling, connection management
- `billing-service`: API key propagation, cache invalidation
- `rate-limiter`: Burst counting, race conditions in sliding windows
- `database-client`: Pool size calculation, connection recycling
