# V1.7 Copy Inventory

Date created: 2026-03-31

Scope:
- English source copy audit from `src/i18n.tsx`
- Mobile-first review
- Focus on functional, clean, helpful product language

Status legend:
- `KEEP` = already clear enough
- `SHORTEN` = useful but too long for mobile
- `REWRITE` = meaning is fine but wording is weak or inconsistent
- `REMOVE` = low-signal or misleading

## Main findings

### 1. English source is not clean yet
- Some English keys still contain Portuguese or Spanish terms.
- This blocks a clean translation pass later because the source language is unstable.

Examples:
- `cities.run` = `Pista de ruta`
- `cities.board` = `Pista del ranking`
- `rider.cityLanes` = `Pistas de ciudad`
- `admin.night.live` = `En vivo`
- `admin.packs.routeNote` = `Nota de ruta`
- `admin.checkpoints.hint` = `Pista`

Priority:
- `REWRITE` immediately

### 2. Too much editorial phrasing in operational UI
- Many strings sound styled but do not help the rider act.
- This is worst in builders, manifest, community, legal, and city surfaces.

Examples:
- `Build the line. Hunt it down.`
- `Take the Discord lane with riders who actually ride.`
- `The cleanest proofs from the latest street hunts.`
- `Run the city your way`

Priority:
- `REWRITE`

### 3. Too many long helper blocks for mobile
- Several sections use paragraph copy where one short line would work better.
- These are high-risk for wrapping and weak scan speed on phones.

Priority:
- `SHORTEN`

### 4. Labels and status states are inconsistent
- Some surfaces say `run`, others say `ride`, others say `hunt`.
- Some actions are nouns, others are verbs.
- Some messages are explicit, others are vague.

Priority:
- `REWRITE`

### 5. Legal and support pages are too dense for mobile
- The copy is readable, but it is too long for fast mobile scanning.
- These pages need shorter lines and cleaner hierarchy.

Priority:
- `SHORTEN`

## Surface audit

## Homepage

### Keep
- `home.alleycat.action` = `Start hunt`
- `home.loop.action` = `Start looping`
- `home.community.action` = `Join the Crew`
- `home.community.aboutAction` = `About`

### Shorten
- `hero.subtitle` = `Loop the city or run a Street Hunt with your local crew.`
  - Shorter target: one line, cleaner scan
- `home.night.body` = `Group lane for after-dark rides, share codes, and crew shots.`
- `home.community.pageIntro`
- `home.community.pageGood1` to `pageGood4`

### Rewrite
- `hero.title` = `Cheat Death on the Streets`
  - Strong tone, weak function
- `home.alleycat.body` = `Build the line, clear the checks, let the city push back.`
- `home.loop.body` = `Set the point, keep it tight, and get back clean.`
- `home.community.header` = `Ride talk, route drops, crew links.`
- `home.community.pageTitle`

### Notes
- Homepage needs shorter module descriptions.
- Buttons are mostly strong already.

## Loop

### Keep
- `loop.heroAction` = `Start loop`
- `loop.build` = `Build loop`
- `loop.openMaps` = `Open in Maps`
- `loop.copyLink` = `Copy link`
- `loop.status.failed` = `Couldn't build a loop. Try another point.`

### Shorten
- `loop.step1.body`
- `loop.step2.body`
- `loop.step3.body`
- `loop.result.body`
- `loop.result.communityBody`
- `loop.status.spent`

### Rewrite
- `loop.title` = `Let's Loop the City`
- `loop.builderTitle` = `Dial The Loop`
- `loop.vibe` = `Ride vibe`
- `loop.terrain.road` = `Road fast`
- `loop.terrain.coast` = `Water edge`

### Notes
- Loop should sound clearer and less styled.
- The surface is close, but still too editorial in headers.

## Street Hunt / Manifest

### Keep
- `alleycat.city` = `City`
- `alleycat.startArea` = `Start area`
- `alleycat.checkpoints` = `Checkpoints`
- `alleycat.build` = `Build manifest`
- `alleycat.result.start` = `Start ride`
- `alleycat.result.finish` = `Close run`
- `alleycat.result.abandon` = `Abandon run`
- `alleycat.result.reset` = `Build another`
- `alleycat.result.checkpointDone` = `Cleared`
- `alleycat.result.checkpointNext` = `Up next`
- `alleycat.result.checkpointWaiting` = `Waiting`
- `alleycat.status.buildFailed` = `Couldn't build the manifest.`
- `alleycat.status.hintFar` = `Move closer to unlock the hint.`

### Shorten
- `alleycat.ghostRiderIntro`
- `alleycat.ghostRiderHint`
- `alleycat.result.body`
- `alleycat.result.ghostLockedBody`
- `alleycat.result.ghostNoticeStart`
- `alleycat.result.ghostNoticeDelta`
- `alleycat.result.proofNeededBody`
- `alleycat.result.proofReadyBody`
- `alleycat.run.addPhotoWall`
- `alleycat.run.uploadLanded`
- `alleycat.run.replayNote`

### Rewrite
- `alleycat.builderTitle` = `Manifest Killer`
- `alleycat.builderSubtitle` = `Build the line. Hunt it down.`
- `alleycat.streetTone` = `Pick your poison`
- `alleycat.style.local` = `Lazy`
- `alleycat.run.spreadLock`
- `alleycat.run.scoreLine`
- `alleycat.run.challengeBoard`

### Remove
- old editorial manifest note strings should stay unused:
  - `alleycat.result.routeLineBody`
  - `alleycat.result.taskMixBody`
  - `alleycat.result.finishCallBody`
  - `alleycat.result.replayHookBody`

### Notes
- This surface is operational. Copy should be the most direct in the product.
- Ghost states should be shorter and more state-based.

## Night Ride

### Keep
- `night.builder.title`
- `night.builder.joinCode`
- `night.builder.haveCode`
- `night.builder.loadCode`
- `night.result.crewCode`
- `night.result.postShot`
- `night.messages.joined`

### Shorten
- `night.subtitle`
- `night.hero.subtitle`
- `night.flow1.body` to `night.flow4.body`
- `night.postSubtitle`
- `night.builder.memberHelper`
- `night.messages.joinedAgain`

### Rewrite
- `night.builder.subtitle` = `Build the crew ride. Share the code.`
- `night.builder.creditLine` = `2 build · 1 join`
- `night.builder.modeRoulette` = `Roulette`
- `night.messages.buildFailed` = `Could not build Night Ride.`

### Notes
- Night Ride is still readable, but the flow copy is too descriptive.
- Route mode labels need a simpler explanation.

## Account

### Keep
- `account.title` = `Account`
- `account.guest.signIn` = `Sign in`
- `account.guest.create` = `Create account`
- `account.profile.save` = `Save profile`
- `account.profile.deleteBike` = `Delete`
- `account.community.action` = `Start community pass`
- `account.community.openInvite` = `Open Discord`
- `account.community.manageBilling` = `Manage pass`

### Shorten
- `account.topbar.kicker`
- `account.profile.helper`
- `account.profile.collaborationNote`
- `account.credits.note`
- `account.community.heroSubtitle`
- `account.community.note`
- `account.activity.note`

### Rewrite
- `account.subtitleAuthed` = `{greeting} Credits, bikes, runs.`
- `account.greeting` = `Yo {name}.`
- `account.auth.subtitle` = `Email in. Ride out.`
- `account.auth.signUpSubtitle` = `Join the crew.`
- `account.feedback.subtitle` = `Keep it direct.`
- `account.profile.subtitle` = `Set your tag.`
- `account.profile.collaborationSubtitle` = `Brotherhood only. No paid lane.`
- `account.credits.subtitle` = `Know the burn.`
- `account.community.subtitle` = `Discord lane and monthly pass.`

### Notes
- Account has many headers that feel branded instead of useful.
- This whole surface needs cleaner hierarchy and clearer plain language.

## Wall, leaderboard, rider, cities

### Keep
- `wall.title`
- `wall.chooseCity`
- `wall.empty`
- `leaderboard.title`
- `leaderboard.empty`
- `rider.notFound`

### Shorten
- `wall.subtitle`
- `wall.nightSubtitle`
- `leaderboard.subtitle`
- `leaderboard.communityNote`
- `cities.subtitle`
- `cities.nextSubtitle`
- `rider.closedRunsGhostGaps`
- `rider.whereTheyHit`
- `rider.whereTheyPost`
- `rider.howTheyStack`

### Rewrite
- `cities.title` = `City Lanes`
- `cities.liveNow`
- `cities.pickLane`
- `cities.hotAskTitle`
- `rider.subtitle` = `Proof, heat, bike.`
- `rider.mainLane`
- `rider.freshProof`
- `leaderboard.quarterLeader`

### Mixed-language fixes needed
- `cities.run`
- `cities.board`
- `cities.runLane`
- `cities.boardLane`
- `rider.cityLanes`

### Notes
- City and rider surfaces need clearer information architecture.
- Several labels are stylish but not explicit.

## Admin

### Keep
- most action labels are acceptable
- `admin.checkpoints.subtitle` = `Task copy and checkpoint inventory.`

### Shorten
- `admin.subtitle`
- `admin.metrics.subtitle`
- `admin.collaboration.subtitle`

### Rewrite
- `admin.title` = `Admin Control`
- `admin.riders.subtitle` = `Credits and free-use reset.`
- `admin.packs.subtitle` = `Route copy, preview, and pack readiness.`

### Mixed-language fixes needed
- `admin.night.live`
- `admin.packs.routeNote`
- `admin.packs.preview`
- `admin.requests.aiDraft`
- `admin.checkpoints.hint`

### Notes
- Admin can stay plain and dry. It does not need brand tone.

## System, auth, legal, support

### Keep
- many basic status messages are already good
- `common.requestFailed`
- `common.authUnavailable`
- `account.messages.discordError`
- `account.messages.discordInactive`

### Shorten
- `legal.privacy.intro`
- `legal.terms.intro`
- `legal.how.intro`
- `legal.how.modesIntro`
- `legal.how.interactionIntro`
- `legal.how.userIntro`
- most `legal.coffee.*` body copy

### Rewrite
- `legal.terms.title` = `Ride your own risk`
- `legal.how.title` = `Run the city your way`
- `legal.coffee.title` = `Buy the crew a coffee`
- `legal.coffee.whyBody`

### Mixed-language fixes needed
- `legal.how.wall.title` = `Mural da Fama`

### Notes
- Legal and support pages should be cut down hard for mobile.
- This is the biggest long-copy surface in the app.

## Priority order for rewrite

### P0
- Remove mixed-language strings from English source
- Rewrite operational copy in:
  - Street Hunt
  - manifest
  - account
  - community pass
- Shorten mobile helper text in builders and run states

### P1
- Homepage rewrite
- Loop rewrite
- Night Ride rewrite
- Cities / rider / leaderboard cleanup

### P2
- Legal and support pages
- Admin copy cleanup

## Recommended next phase

Phase 2 should define the system before rewriting strings:
- target length by copy type
- tone by copy type
- rules for buttons, helper text, status, and errors
- approved vocabulary:
  - `run`
  - `ride`
  - `hunt`
  - `proof`
  - `board`
  - `wall`
  - `community pass`

## Immediate rewrite candidates

High-value strings to fix first:
- `hero.title`
- `home.alleycat.body`
- `home.loop.body`
- `home.night.body`
- `home.community.header`
- `loop.builderTitle`
- `alleycat.builderTitle`
- `alleycat.streetTone`
- `account.greeting`
- `account.community.heroTitle`
- `cities.title`
- `rider.subtitle`

