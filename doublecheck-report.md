# Doublecheck report

> Verdict: **green**

## Spec
- Goal: The live DSH web GUI at http://127.0.0.1:3080 renders in a black, square, mono-accented skin implemented as a separate standalone plugin (custom-dsh-theme), while dsh-claude-style keeps every animation and interface affordance it ships, untouched.
- Scope: In scope: a new bundle at /home/oiupoyt/my stuff yea/projects/custom-dsh-theme (package.json, cordis.patch.yml, index.js host half, client.js skin, test/, README.md, docs previews); its install into the web profile; a Settings > "Custom DSH Theme" section with Accent, Density, Motion, Prose font, Reset; paint delivered only through ctx.theme.overrideTokens plus a self-owned <style> node; light and dark token pairs; a minimal public git repo on GitHub + Forgejo; the working-session spinner (small hollow square rotation) and the effort picker (sliding segmented bar for the list form, accent fill and spring knob for the slider form). Out of scope: any edit to dsh-claude-style source or its config block, new brand art, bundled font files, changes to the host app (apps/web) or other plugins.
- Acceptance criteria: 1) Page loads with zero failed-plugin cards and zero console errors. 2) Every element measures border-radius 0 across the full DOM (0 of ~2300+ elements rounded). 3) Dark: body bg rgb(0,0,0), --dsw-alias-bg-base #000000, layer-2 #0e0e0e, border-l1 #1f1f1f. Light: base #f4f4f2, layer-2 #ffffff, border #dedcd8. 4) Chrome renders in the mono stack; answer prose renders sans by default and switches to mono on demand. 5) Settings section shows all five controls, all square, each switching state live and persisting across reload; Reset returns to defaults and clears the stored key. 6) Calm motion stops decorative loops but leaves progress indicators and the caret blinking. 7) Removing claude-style body attributes still leaves the page black, square and mono. 8) node --test passes 23/23; rendered text pairs meet WCAG AA (>=4.5:1). 9) The working-session spinner (svg[data-state=ongoing]) is an 8x8 hollow square spinner (kat-square-spin: rotate 1turn over .85s linear) with a 1px label-primary border, transparent background, and radius 0; it stays infinite under calm and under prefers-reduced-motion (named explicitly there, slowed to 1.6s), with no glow pulse and no filled square. 10) The effort picker renders as a horizontal segmented sliding bar: equal segments, no label truncation, a spring-eased pill that follows aria-checked, native clicks/keyboard preserved, the model list and the permission popover never marked; the apex slider form gets an accent fill, hairline track, LED ticks and an overshoot-eased knob.
- Failure modes: 1) A client bundle reading an undeclared service (e.g. ctx.styles) throws "cannot get property without inject" and the plugin shows a failed card: the bundle must own its own style node and declare exactly what it injects. 2) A bare-string token value throws when overrideTokens expects a {dark, light} pair: every token passes a pair. 3) claude-style repainting over the skin: skin writes documented host tokens that outrank plugin palettes, and is verified with claude-style attributes stripped. 4) Calm motion zeroing infinite animations makes loading look finished and kills the caret: progressbar/aria-busy/caret-layer are re-armed to infinite. 5) Prose staying serif because claude-style's private --dsh-claude-font-prose is unset or a literal .markdown selector misses a hashed CSS-module class: set the private token and match [class*=markdown]. 6) Settings preferences lost on reload or Reset failing to clear them: prefs persist in localStorage under custom-dsh-theme.prefs. 7) A plugin upgrade changing internals breaks the page: degrade to less tuning, never a broken surface. 8) Light mode text falling below AA against the light ground. 9) Host presenter overwriting body inline tokens from a snapshot that dropped the skin layer: skin subscribes to theme/change and re-asserts only when the snapshot stops carrying its tokens. 10) Host menu rows carrying min-width:100% block flex shrink and overflow the bar: the bar options must set min-width:0. 11) A MutationObserver-driven pill write retriggering itself forever: pill styles are written only when changed, and menus are marked once. 12) The effort enhancer must never touch the model list or the permission popover: labels match exactly with every-radio and a size cap (a substring check matched names like "o3 Mini High" in the 1023-row model list and laid it out as a bar), perm popover is excluded, and a marked menu that stops qualifying is unmarked and its pill removed.
- Priorities: Keep all claude-style behavior over visual ambition; documented host tokens over private selectors; square shape and legibility over decoration; working standalone over depending on claude-style; small driven-by-tests surface over feature breadth.
- Non-goals: Do not modify dsh-claude-style or its config. Do not add brand art, mascots, logo replacements or bundled font files. Do not add light/dark auto-switching UI beyond what the host already offers. Do not publish to any marketplace. Do not touch the host checkout at ~/.npm-global/lib/node_modules/@deepseek-ai/dsh. Do not reformat or churn unrelated files.

## Test evidence
- failing runs: 3
- passing runs: 57

- [green] cd "/home/oiupoyt/my stuff yea/projects/custom-dsh-theme" && node --test 2>&1 | grep -E "^# (pass|fail)|^not ok"
- [green] cd "/home/oiupoyt/my stuff yea/projects/custom-dsh-theme" && node --test 2>&1 | grep -E "^# (pass|fail)|^not ok"
- [green] cd "/home/oiupoyt/my stuff yea/projects/custom-dsh-theme" && node --test 2>&1 | grep -E "^# (pass|fail)|^not ok"
- [green] cd "/home/oiupoyt/my stuff yea/projects/custom-dsh-theme" && node --test 2>&1 | grep -E "^# (pass|fail)|^not ok"
- [spec] The live DSH web GUI at http://127.0.0.1:3080 renders in a black, square, mono-accented skin implemented as a separate s…
- [green] cd "/home/oiupoyt/my stuff yea/projects/custom-dsh-theme" && node --test 2>&1 | grep -E "^# (pass|fail)|^not ok"
- [green] cd "/home/oiupoyt/my stuff yea/projects/custom-dsh-theme" && node --test 2>&1 | grep -E "^# (pass|fail)|^not ok"
- [spec] The live DSH web GUI at http://127.0.0.1:3080 renders in a black, square, mono-accented skin implemented as a separate s…
- [red] node --test --test-name-pattern='session spinner is a plain square spinner' test/theme.test.mjs
- [green] node --test --test-name-pattern='session spinner is a plain square spinner' test/theme.test.mjs
- [green] node --test
- [spec] The live DSH web GUI at http://127.0.0.1:3080 renders in a black, square, mono-accented skin implemented as a separate s…
- [red] node --test --test-name-pattern='session spinner is a solid square spinner' test/theme.test.mjs
- [green] node --test --test-name-pattern='session spinner is a solid square spinner' test/theme.test.mjs
- [green] node --test
- [spec] The live DSH web GUI at http://127.0.0.1:3080 renders in a black, square, mono-accented skin implemented as a separate s…
- [red] node --test --test-name-pattern='session spinner is a small hollow square spinner' test/theme.test.mjs
- [green] node --test --test-name-pattern='session spinner is a small hollow square spinner' test/theme.test.mjs
- [green] node --test
- [spec] The live DSH web GUI at http://127.0.0.1:3080 renders in a black, square, mono-accented skin implemented as a separate s…
- … 48 earlier rows omitted

## Adversary review
No adversary review ran for this session.

## Verification
Not run.

## Delivery
- implementation edits: 32
