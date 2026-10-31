# Story memory (`scripts/story.mjs`, `stories/<series>/`)

One bible per series, in git, checked like code. Agents read a *slice* of it per scene (`context`), never the whole
story; they never change approved canon themselves. Zero dependencies (`node:test` for the tests).
Example and test fixture: `stories/demo-dorm9/` (an original demo series, not a real episode).

```
node .agents/skills/tumraikortum/scripts/story.mjs check   <series>                      # before writing, after writing
node .agents/skills/tumraikortum/scripts/story.mjs context <series> <ep> [--who a,b] [--shot n]   # paste into the scene prompt
node .agents/skills/tumraikortum/scripts/story.mjs state   <series> <ep>                 # resolved state at the end of <ep> (JSON)
node .agents/skills/tumraikortum/scripts/story.mjs cast    <series> <ep> --out <ep>/cast.js    # looks for kit/rig.js
node .agents/skills/tumraikortum/scripts/story.mjs approve <series> <proposal-id>         # USER ONLY
node .agents/skills/tumraikortum/scripts/story.mjs lock    <series> --yes                # USER ONLY (first approval)
node --test ".agents/skills/tumraikortum/scripts/*.test.mjs"                             # continuity + motion tests
```

## Files

| file | who writes it |
|---|---|
| `stories/<series>/bible.json` | agents add **draft** items; canon items change only through `approve` |
| `stories/<series>/proposals/<id>.json` | agents: `{ id, by, why, changes: [{ op: set\|add\|remove, path, value }] }` |
| `stories/<series>/canon.lock.json` | only `approve` / `lock` (fingerprints of every canon item) |

`path` walks objects by key and lists by item id: `characters/praew/look/hairStyle`, `facts/f5/status`, `events` (with `add`).

## What each thing in the bible means

| section | fields | status |
|---|---|---|
| `episodes[]` | `id, title, after` (parent episode: branches share a parent), `choice`, `summary` | `canon` · `draft` |
| `characters{}` | `name, body, role, traits[], voice, look{}` (a `kit/rig.js` `who`, validated by `R.check`), `knows[]`, `present` | `canon` · `draft` |
| `facts[]` | `text, about[]` (characters; empty = world rule), `secret` | `canon` · `draft` · `unknown` (undecided: never write it as fact) |
| `events[]` | `ep, shot, who[], text`, `learn[{who, fact, belief}]`, `uses[{who, fact}]`, `set{who: {present, look{}}}` | follows its episode |
| `threads[]` | `plant` (event), `payoff` (event or null) — foreshadowing | open threads are warnings |
| `tests[]` | `ep, after?, expect{ "who.present" \| "who.look.field" \| "who.knows.fact": value }, why` | continuity tests |

Belief: `true` (knows) · `false` (believes the opposite — a character can be fooled) · `unsure`. A character who
`uses` a fact must believe it in that branch. Character Belief therefore lives in `learn`, not in `facts`.

## What `check` catches

- references to unknown episodes / characters / facts / events; duplicate ids; bad statuses
- a character in an event after they left (`present: false`) in the same branch — branches are separate
- acting on a fact before learning it, after being fooled, or a fact that is still `unknown`
- a thread paid off before it is planted, or on a branch that never planted it
- a look the rig cannot draw (`hairStyle: 'mohawk'`, `skin: 'pink'`, unknown fields)
- every `tests[]` expectation
- canon edited, added or removed outside `approve` (canon lock)

## Rules for agents

1. Before writing a scene: `context <series> <ep> --shot n --who …` and use only that.
2. New ideas go in as `draft` (episode, fact, event) or as `unknown` facts. Never set `status: canon`.
3. Changing anything canon (a past episode, an approved fact or character): write `proposals/<id>.json` with a
   `why`, run `check`, and ask the user to run `approve`. Never run `approve` or `lock` yourself.
4. After writing STORY.md / STORYBOARD.md: add the episode's events (`shot` numbers from the storyboard), `learn`,
   `set` for look/presence changes, threads, and a continuity test for every fact the twist depends on. `check` must pass.
5. Before drawing: `cast <series> <ep> --out <ep>/cast.js` and load it after `kit/rig.js` in index.html;
   draw with `R.draw(ctx, { who: 'praew', … })` (body comes from the bible). Don't copy colours into film.js.
