# V1.7 Copy Style Guide

Date created: 2026-03-31

Purpose:
- make product copy functional
- keep mobile layouts clean
- make English the stable source language

## Core rule

When tone and clarity conflict, clarity wins.

## Product voice

Target voice:
- direct
- calm
- useful
- short

Avoid:
- dramatic slogans
- metaphor that does not guide action
- filler
- decorative attitude in operational UI

Use:
- plain verbs
- short labels
- explicit state language
- action before explanation

## Copy types

## 1. Headers

Use for:
- page titles
- card titles
- section titles

Target:
- 1 to 4 words
- ideally one line on mobile

Rules:
- name the thing, do not pitch it
- avoid slogans
- avoid punctuation unless needed

Good:
- `Street Hunt`
- `Community access`
- `Loop history`

Bad:
- `Take the Discord lane with riders who actually ride`
- `Run the city your way`

## 2. Subheaders

Use for:
- short support under a title

Target:
- under 60 characters
- one short sentence

Rules:
- explain what the section is for
- do not repeat the title in different words

Good:
- `Build a route and open it in Maps.`
- `Runs, times, and proofs.`

Bad:
- `Build the line. Hunt it down.`
- `Organize rides, talk bikes, and connect with riders in your city and beyond.`

## 3. Helper text

Use for:
- field help
- setup notes
- short operational guidance

Target:
- 1 sentence
- under 80 characters when possible

Rules:
- say what to do
- if needed, say when or why
- one instruction per line

Good:
- `Pick a city to load checkpoints.`
- `Link Discord after payment.`

Bad:
- multi-sentence notes
- story-like explanation

## 4. Buttons

Use for:
- all clickable actions

Target:
- 2 to 4 words
- 1 verb max

Rules:
- start with a verb when possible
- avoid vague labels
- do not use punctuation

Good:
- `Build loop`
- `Open Discord`
- `Send proof`
- `Manage pass`

Bad:
- `Join the Crew` for billing action if it actually opens checkout
- `View details` if it opens billing

## 5. Status lines

Use for:
- active state
- loading state
- locked state
- completion state

Target:
- 2 to 6 words

Rules:
- present tense
- explicit state
- no extra flavor

Good:
- `Building manifest...`
- `Clock is live.`
- `Proof sent`
- `Run finished`

Bad:
- `Ghost update landed.`
- `The wall is clean.`

## 6. Errors

Use for:
- failure states

Target:
- 1 sentence
- under 90 characters when possible

Rules:
- say what failed
- say what to do next if there is a clear next step
- avoid generic language

Good:
- `Couldn't build the loop. Try another point.`
- `Move closer to unlock the hint.`

Bad:
- `Request failed.`
- `Could not proceed right now.`

## 7. Empty states

Use for:
- empty lists
- no data

Target:
- 1 sentence

Rules:
- say what is missing
- point to next action if useful

Good:
- `No loop history yet.`
- `No night rides built yet.`

Bad:
- `The wall is clean.`

## 8. Confirmation states

Use for:
- successful actions

Target:
- 1 sentence

Rules:
- confirm result
- keep it brief

Good:
- `Profile saved.`
- `Discord linked. Access is live.`
- `Feedback sent.`

Bad:
- `Night Ride post landed on the night wall.`

## Approved vocabulary

Use these terms consistently:
- `loop` = route mode from one start point
- `Street Hunt` = product mode name
- `manifest` = generated Street Hunt list
- `run` = active Street Hunt session
- `ride` = loop or night ride action
- `proof` = image used to validate/post
- `wall` = public proof feed
- `board` = ranking surface
- `community pass` = paid Discord membership
- `bike in use` = selected bike for current action

Avoid mixing:
- `hunt` and `run` in the same UI block unless they mean different things
- `crew pass`, `community pass`, and `Discord pass`
- `board`, `ranking`, and `leaderboard` unless the page name needs it

## Mobile-first limits

Recommended limits:
- page title: 18 characters preferred, 28 max
- section title: 24 characters max
- button: 16 characters preferred
- helper text: 80 characters preferred
- status line: 48 characters preferred
- empty state: 70 characters preferred

If a line breaks badly on mobile:
- shorten first
- split second
- redesign last

## Rewrite priorities

Priority order:
1. operational builder and manifest copy
2. account and community billing copy
3. homepage cards and modal copy
4. city, wall, leaderboard, rider surfaces
5. legal and support pages
6. admin cleanup

## Source-language rule

English source must contain:
- only English
- no Portuguese labels
- no Spanish labels

Translations start only after:
- English headers are stable
- English actions are stable
- English state language is stable

## Review checklist for each rewrite

Before a string is accepted:
- does it help the rider act
- is it shorter than the current version
- does it fit a phone width better
- does it avoid decorative tone
- does it use approved vocabulary
- does it still make sense without surrounding context

