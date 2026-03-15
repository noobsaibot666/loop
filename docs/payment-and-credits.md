# Payment And Credits

Date: 2026-03-14

This file is the compact source of truth for how payments, credits, and usage work in the app right now.

## Current live model
- The live payment model is `one-time credit top-ups`.
- The live provider is `Stripe Checkout`.
- The live top-up currency is `USD`.
- There is `no live recurring subscription` yet.
- The next prepared membership tier is `5 USD / month`.
- Discord/community access is `not live` yet.

## Credit types
There are 2 live usage buckets for normal riders:

1. `Free loop allowance`
- Each rider gets `3 free loops`.
- These are tracked as `free_used` and `free_remaining`.
- Free allowance is for the standard Loop flow.

2. `Paid credits`
- Paid credits are stored in `user_credits.credits`.
- These are granted after a successful Stripe payment.
- Paid credits are used for Alleycat and for Loop once free loops are gone.

Admin accounts are different:
- Admin riders are treated as `unlimited`.
- Admin usage returns `9999` remaining and does not burn down normally.

## Live pricing logic
Top-ups currently work like this:

- Minimum checkout amount: `5.00 USD`
- Credit grant formula: `floor(amount_in_cents / 50)`
- Effective rate: `1 credit per $0.50`

Examples:
- `$5.00` => `10 credits`
- `$10.00` => `20 credits`
- `$12.00` => `24 credits`

## Usage rules
### Loop
- Loop costs `1 unit` per build.
- The app uses the `3 free loops` first.
- After free loops are spent, Loop starts consuming `paid credits`.

Order for Loop:
1. free allowance
2. paid credits

### Alleycat
- Alleycat costs `3 paid credits` per manifest build.
- Alleycat does `not` consume the free loop allowance.
- If the rider does not have at least `3 paid credits`, manifest generation is blocked.

### Shared Alleycat join
- Joining a shared Alleycat by code also costs `3 paid credits`.
- Re-opening a challenge the rider already joined does not charge again for that existing joined entry.

## What the rider sees
On the account page the rider can currently see:
- total credits
- free loops left
- paid credits live
- Loop burn
- Alleycat burn
- recent Stripe top-ups

The app copy should stay aligned with the real rules:
- `Loop burns 1`
- `Alleycat burns 3`
- `Free loops` are only the starter allowance for Loop

## Payment flow
The live checkout flow is:

1. Rider opens `Add credits`
2. Rider enters an amount in `USD`
3. App creates a Stripe Checkout session
4. Stripe returns to the app with a `session_id`
5. App verifies the Stripe session
6. Credits are added to `user_credits`
7. Session is logged in `stripe_sessions`

## Persistence and audit
Current relevant data storage:

- `user_credits`
  - stores paid credits and free loop usage
- `stripe_sessions`
  - stores checkout session audit data
- `donations`
  - legacy audit/dedupe log still used by verify/webhook flow

## Current edge-case behavior
- If checkout is cancelled, no credits are added.
- If webhook delivery is delayed, the app can still verify the Stripe session on return.
- If a rider is logged out or the session expires, payment/usage calls fail and require login again.
- If a rider does not have enough paid credits for Alleycat, the app returns a block instead of partially building.

## Not live yet
These are intentionally not active in production right now:

- monthly recurring membership
- USD subscription billing for community access
- Discord access gating
- automatic monthly free-credit drops for members
- subscription tiers

## Deferred membership plan
The intended later layer is:
- monthly access pass
- prepared Stripe subscription price: `5 USD / month`
- Discord community access
- monthly free credits
- reserved launch invite: `https://discord.gg/2wWFKuQ7`

But that is `deferred` until:
- the Discord community is actually ready
- recurring billing is fully wired and tested
- account subscription state exists
- monthly credit grants are automated

## Operator summary
If you need the shortest possible read:

- Loop = `1`
- Alleycat = `3`
- Free starter loops = `3`
- Top-ups = `USD one-time only`
- Credit rate = `1 per $0.50`
- Subscription tiers = `not live yet`
