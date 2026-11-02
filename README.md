# custom-dsh-theme

A personal theme for the DeepSeek Harness web GUI. Not a product, not a
marketplace plugin, and not affiliated with DeepSeek.

Black, square, mono, quiet. It sits beside [dsh-claude-style] and repaints it:
you keep that plugin's composer, popovers, navigator, mascot and motion, but the
board underneath becomes this one.

[dsh-claude-style]: https://github.com/Nwflower/dsh-claude-style

## What it changes

- **Colour.** True black ground, `#0e0e0e` panels, `#1f1f1f` hairlines. Sky is
  the default accent; emerald and a plain mono variant are one click away.
- **Shape.** Every corner is square, enforced on every element and pseudo
  element, because the host exposes no radius token for most of its surfaces.
- **Type.** JetBrains Mono for chrome and code. Answer text stays in a neutral
  sans unless you switch it to mono.
- **Motion.** Calm by default: chrome loops stop, one-shot transitions stay
  snappy. Progress indicators keep spinning so loading never looks finished.

Both light and dark are supported. Dark is the intended look.

## Install

```sh
dsh plugin --profile web add /absolute/path/to/custom-dsh-theme
```

Then reload the page. The theme appears in Settings under **Custom DSH Theme**.

If `dsh` cannot find `pnpm`, point it at yours for that one command:

```sh
PATH="$HOME/.npm-global/bin:$PATH" dsh plugin --profile web add /absolute/path/to/custom-dsh-theme
```

## Remove

```sh
dsh plugin --profile web remove custom-dsh-theme
```

The theme's preferences live in `localStorage` under `custom-dsh-theme.prefs`
and are ignored once the bundle is gone. Clear that key to start fresh.

## Settings

| Control | Values | Effect |
| --- | --- | --- |
| Accent | Sky, Emerald, Mono | Recolours buttons, links, focus rings and selected marks |
| Density | Comfortable, Compact | Prose rhythm and list-row padding only, never a layout change |
| Motion | Calm, Full | Calm stops decorative loops; Full hands motion back to claude-style |
| Prose | Sans, Mono | Typeface of answer text |
| Reset | | Back to defaults and clears the stored preference |

## Notes

- Works with `dsh-claude-style` disabled. It only writes documented host
  tokens, so an upgrade of either plugin degrades to "less tuning", never to a
  broken page.
- No bundler, no build step, no dependencies. `client.js` is loaded as-is.
- Tests: `node --test`
