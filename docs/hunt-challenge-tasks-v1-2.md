# Hunt Ride Challenge Tasks — v1.2

Date: 2026-05-01
Status: Shipped

## What changed

Checkpoint tasks in Street Hunt (Alleycat Mode) are no longer just selfie prompts. Each manifest now assigns a **challenge type** to every checkpoint. Riders must complete the challenge to register proof and keep their clock moving.

Four challenge types rotate per manifest:

| Type | Frequency | Description |
|---|---|---|
| `photo` | 50% | Existing selfie flow — unchanged |
| `math` | ~17% | Simple arithmetic generated at manifest build time |
| `riddle` | ~17% | Short classic riddle from a locale-native bank |
| `pop_culture` | ~17% | Widely known factual question |

Questions are served in the rider's app language (EN / PT-BR / ES). Math questions are universal.

---

## Architecture

### Challenge assignment

Challenges are assigned in `shared/messenger.js` inside `buildMessengerManifestFromPack()`. The assignment is **deterministic**: the same manifest seed always produces the same questions. The pattern `["photo", "math", "photo", "riddle", "photo", "pop_culture"]` repeats over the checkpoint array. Question banks are shuffled with the manifest seed before selection.

```
manifest seed
  → seededOrder(RIDDLE_BANKS[locale], seed)
  → seededOrder(POP_CULTURE_BANKS[locale], seed ^ 0xabcd1234)
  → generateMathChallenge(seed + index * 17, locale)
  → checkpoint.challenge = { type, question, answer, alt_answers? }
```

The `challenge` object is embedded in the manifest JSON and travels to the client.

### Client-side validation

Answer validation (`validateChallengeAnswer`) runs **on the client** before any API call. Wrong answers are rejected locally — the server never receives them. This keeps latency zero on wrong attempts and avoids server load from repeated tries.

```
submitAnswer(checkpoint, input)
  → validateChallengeAnswer(challenge, input) → false → return "wrong" (no API call)
  → validateChallengeAnswer(challenge, input) → true  → POST /api/messenger/proof { proof_type: "answer" }
```

Normalisation: both the stored answer and user input go through `norm()` — lowercase, trim, strip non-alphanumeric (preserves spaces). Accented characters from PT/ES are stripped on both sides so `"pacífico"` and `"pacifico"` both match. `alt_answers` arrays cover common alternate phrasings.

### Proof storage

Answer proofs use the existing `messenger_proof_posts` table with two new columns:

| Column | Type | Default | Purpose |
|---|---|---|---|
| `proof_type` | `text` | `'photo'` | `'photo'` or `'answer'` |
| `answer_text` | `text` | `null` | What the rider submitted |

Answer proofs are always `is_public = false` — they never appear on the Wall of Fame. The wall query filters on `is_public = true`, so no wall changes were needed.

---

## Files changed

| File | Change |
|---|---|
| `shared/messenger.js` | Question banks (3 locales × 2 types = 6 arrays), `generateMathChallenge`, `assignChallenges`, `validateChallengeAnswer` (exported) |
| `src/types/index.ts` | `CheckpointChallenge` union type; `challenge?` on `MessengerCheckpoint`; `proof_type?` and `answer_text?` on `MessengerProof` |
| `functions/api/messenger/generate.js` | Accepts `locale` from request body; passes it to both build paths |
| `functions/api/messenger/_helpers.js` | `getRunProofs` SELECT includes `proof_type,answer_text` |
| `functions/api/messenger/proof.js` | Handles `proof_type: "answer"` — skips file validation, stores answer, forces `is_public: false` |
| `src/store/useAlleycatStore.ts` | `submitAnswer()` action; `locale` sent with generate request |
| `src/pages/AlleycatMode.tsx` | Proof panel branches on `challenge.type`; answer input + wrong-answer feedback |
| `src/styles.css` | `.challenge-answer-input`, `.proof-callout.error`, `@keyframes shake` |
| `src/i18n.tsx` | `alleycat.challenge.*` keys in EN, PT, ES |

---

## DB migration applied

```sql
ALTER TABLE messenger_proof_posts
  ADD COLUMN IF NOT EXISTS proof_type text NOT NULL DEFAULT 'photo',
  ADD COLUMN IF NOT EXISTS answer_text text;
```

Applied to project `gcqphvljyctpkfkpcsbj` (Give me the Loop) on 2026-05-01.

---

## Question banks

### English
- **Riddles** (`RIDDLE_BANK_EN`): 20 logic-based riddles in English. No language wordplay.
- **Pop culture** (`POP_CULTURE_BANK_EN`): 20 factual questions with numeric or single-word answers universally known.

### Portuguese (pt-BR)
- **Riddles** (`RIDDLE_BANK_PT`): 20 native Brazilian Portuguese riddles (*adivinhações*). Written for PT natively — not translated from English.
- **Pop culture** (`POP_CULTURE_BANK_PT`): Same factual topics as EN, fully translated. Answers remain universal (numbers, single-word).

### Spanish (es)
- **Riddles** (`RIDDLE_BANK_ES`): 20 native Spanish riddles (*adivinanzas*). Written for ES natively.
- **Pop culture** (`POP_CULTURE_BANK_ES`): Same factual topics as EN, fully translated.

### Math (universal)
Generated at manifest build time. No bank — produces a fresh question per checkpoint from the seed. Operations: `+`, `-`, `×`. Range: small numbers (3–22 for addition/subtraction, 2–10 for multiplication). Intro phrase localised (`"What is"` / `"Quanto é"` / `"¿Cuánto es"`).

---

## Locale flow

1. Client reads `localStorage.getItem("loop_language")` before generating a manifest.
2. Sends `locale: "pt"` (or `"en"`, `"es"`) with the generate request.
3. Server normalises `"pt-BR"` → `"pt"` via `.split("-")[0]`.
4. `buildMessengerManifestFromPack` passes `locale` to `assignChallenges`.
5. Questions embedded in the manifest — rider sees them in their language throughout the run.

If an unrecognised locale arrives, it falls back to `"en"`.

---

## UX behaviour

- The challenge panel appears **after GPS check-in** (same gate as the photo panel).
- For `photo` checkpoints: unchanged selfie flow.
- For answer checkpoints: question shown in callout, text input, Submit button.
  - Enter key also submits.
  - Wrong answer: red callout + shake animation on the button (re-triggers on each wrong attempt via React `key` remount).
  - Correct answer: panel transitions to "Proof landed" state.
- Answer proofs do **not** appear on the Wall of Fame.
- Manifest regeneration resets all answer state (inputs, wrong counts).

---

## Known trade-offs

- **Client-side validation only.** A technically motivated rider could POST directly to `/api/messenger/proof` with `proof_type: "answer"` and bypass the question. Acceptable trade-off — this is a racing game where cheating harms only the cheater's own time.
- **Questions baked at generation time in the creator's locale.** All crew riders load the same manifest with the same questions. This is correct — challenge codes are always co-located (same city, same time, same checkpoints by GPS). There is no cross-city or cross-locale challenge scenario.
- **Answer normalisation strips accents.** `"dióxido de carbono"` and `"dioxido de carbono"` are treated identically. Intentional — makes typing on mobile less frustrating. `alt_answers` arrays cover common variants.

---

## Adding questions

To add questions to a bank, edit the relevant array in `shared/messenger.js`:

```js
// English riddle example
{ question: "...", answer: "canonical answer", alt_answers: ["variant1", "variant2"] }
```

Rules:
- Answer must be the most obvious phrasing; `alt_answers` covers common variants.
- All answers stored lowercase (the `norm()` function lowercases at validation time anyway).
- Riddles must make sense in the target language natively — do not add machine translations.
- Pop culture questions must have stable, universally known factual answers (no current events, no sports records).

Deploy is automatic on next Cloudflare Workers deploy — no DB change needed.
