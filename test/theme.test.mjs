import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(fileURLToPath(new URL('.', import.meta.url)))

function luminance(hex) {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255)
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** Coarse selector specificity as comparable weights: ids, then classes/attrs. */
function specificity(selector) {
  const ids = (selector.match(/#[\w-]+/g) || []).length
  const attrs = (selector.match(/\[[^\]]+\]/g) || []).length
  const classes = (selector.match(/\.[\w-]+/g) || []).length
  return ids * 100 + (attrs + classes) * 10
}

/**
 * claude-style declares its prose variables on a two-attribute body selector,
 * so any binding of ours that is meant to win must outrank that weight.
 */
const CLAUDE_PROSE_DECL_WEIGHT = specificity('body[data-dsh-claude-style][data-dsh-claude-typeface=claude]')

/**
 * Boot the browser module in a sandbox with a recording context. Returns the
 * observed §calls so tests assert behaviour, not internals.
 */
async function boot() {
  const source = await readFile(path.join(ROOT, 'client.js'), 'utf8')
  let registration = null
  const calls = { tokens: [], css: [], slots: [], attrs: [], events: [], disposers: [] }

  const bodyAttrs = new Map()
  const documentStub = {
    body: {
      setAttribute: (k, v) => {
        bodyAttrs.set(k, String(v))
        calls.attrs.push([k, String(v)])
      },
      removeAttribute: (k) => bodyAttrs.delete(k),
      getAttribute: (k) => (bodyAttrs.has(k) ? bodyAttrs.get(k) : null),
      style: { setProperty() {}, removeProperty() {} },
      appendChild() {},
    },
    documentElement: { style: {}, setAttribute() {}, removeAttribute() {} },
    querySelector: () => null,
    createElement: (tag) => ({
      tagName: String(tag).toUpperCase(),
      textContent: '',
      style: {},
      dataset: {},
      setAttribute() {},
      appendChild() {},
      append() {},
      remove() {},
    }),
    head: {
      append(node) {
        if (node && node.tagName === 'STYLE') calls.css.push(node.textContent)
      },
      appendChild(node) {
        if (node && node.tagName === 'STYLE') calls.css.push(node.textContent)
      },
    },
  }

  const sandbox = {
    window: {},
    document: documentStub,
    localStorage: {
      _v: new Map(),
      getItem(k) { return this._v.has(k) ? this._v.get(k) : null },
      setItem(k, v) { this._v.set(k, String(v)) },
      removeItem(k) { this._v.delete(k) },
    },
    console,
    setTimeout,
    clearTimeout,
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    getComputedStyle: () => ({ backgroundColor: '#000000' }),
  }
  sandbox.window = sandbox
  sandbox.globalThis = sandbox
  sandbox.window.__ModuleLoader__ = {
    load(def) {
      registration = def
    },
  }

  vm.createContext(sandbox)
  vm.runInContext(source, sandbox, { filename: 'client.js' })
  assert.ok(registration, 'client.js must register through window.__ModuleLoader__.load')
  assert.equal(registration.id, 'custom-dsh-theme')

  const React = {
    createElement: (type, props, ...children) => ({ type, props, children }),
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
    useEffect: () => {},
    Fragment: 'Fragment',
  }

  const module = registration.factory((name) => {
    if (name === 'react') return React
    throw new Error(`unexpected require: ${name}`)
  })

  assert.equal(typeof module.apply, 'function', 'module must expose apply')
  assert.equal(module.name, 'custom-dsh-theme')

  const ctx = {
    get: () => undefined,
    on: (name, fn) => {
      const entry = { name, fn, off: false }
      calls.events.push(entry)
      return () => {
        entry.off = true
      }
    },
    effect: (fn) => {
      const dispose = fn()
      const run = typeof dispose === 'function' ? dispose : () => {}
      calls.disposers.push(run)
      return run
    },
    theme: {
      overrideTokens(source, tokens) {
        calls.tokens.push({ source, tokens })
        return () => {}
      },
    },
    slots: {
      inject: (_name, cb) => {
        const dispose = cb()
        return typeof dispose === 'function' ? dispose : () => {}
      },
      register: (options, component) => {
        calls.slots.push({ options, component })
        return () => {}
      },
    },
  }

  // Only the two services the plugin declares. `styles` is a dynamic-package
  // builtin that a static bundle never receives, so it must not be required.
  module.apply(ctx)
  assert.deepEqual([...module.inject].sort(), ['slots', 'theme'])

  return { calls, module }
}

test('registers a theme token layer with a light/dark pair for every token', async () => {
  const { calls } = await boot()
  assert.ok(calls.tokens.length >= 1, 'apply must call ctx.theme.overrideTokens')
  const layer = calls.tokens[0]
  assert.equal(layer.source, 'custom-dsh-theme')
  const names = Object.keys(layer.tokens)
  assert.ok(names.length >= 40, `expected broad token coverage, got ${names.length}`)

  for (const name of names) {
    assert.match(name, /^--[a-z0-9-]+$/)
    const value = layer.tokens[name]
    assert.equal(typeof value, 'object', `${name} must be a { light, dark } pair`)
    assert.equal(typeof value.light, 'string', `${name}.light must be a string`)
    assert.equal(typeof value.dark, 'string', `${name}.dark must be a string`)
  }
})

/**
 * Radii are 0 in both modes on purpose, and these masks read the same over
 * either substrate. Every other repainted token must carry a real light value,
 * otherwise light mode silently renders dark.
 */
const MODE_INDEPENDENT = new Set([
  '--dsw-alias-bg-mask-3',
  '--dsw-alias-bg-mask-photo',
  '--dsw-alias-tooltip-key-bg',
  '--dsw-radius-xs',
  '--dsw-radius-sm',
  '--dsw-radius-md',
  '--dsw-radius-lg',
  '--dsw-radius-xl',
  '--dsw-radius-panel',
])

test('light mode is a distinct palette, not dark values reused', async () => {
  const { calls } = await boot()
  const t = calls.tokens[0].tokens
  const isColor = (v) => /^#[0-9a-f]{3,8}$/i.test(v)
  let checked = 0
  for (const [name, value] of Object.entries(t)) {
    if (MODE_INDEPENDENT.has(name)) continue
    if (!isColor(value.dark) || !isColor(value.light)) continue
    checked += 1
    assert.notEqual(
      value.light,
      value.dark,
      `${name} is ${value.light} in both modes, so light mode would render dark`,
    )
  }
  assert.ok(checked >= 60, `expected broad colour coverage, only checked ${checked}`)
})

test('paints the obsidian signature on the dark palette', async () => {
  const { calls } = await boot()
  const t = calls.tokens[0].tokens
  assert.equal(t['--dsw-alias-bg-base'].dark, '#000000')
  assert.equal(t['--dsw-alias-bg-layer-2'].dark, '#0e0e0e')
  assert.equal(t['--dsw-alias-border-l1'].dark, '#1f1f1f')
  assert.equal(t['--dsw-alias-border-l2'].dark, '#1f1f1f')
  assert.equal(t['--dsw-alias-label-primary'].dark, '#f2f2f2')
  assert.equal(t['--dsw-alias-brand-primary'].dark, '#7dd3fc')
  assert.equal(t['--dsw-alias-state-success-primary'].dark, '#6ee7a8')
  assert.equal(t['--dsw-alias-state-error-primary'].dark, '#f87171')
  assert.equal(t['--dsw-specific-sidebar-fill'].dark, '#000000')
})

test('light mode stays square and legible on paper neutrals', async () => {
  const { calls } = await boot()
  const t = calls.tokens[0].tokens
  const pairs = [
    ['--dsw-alias-label-primary', '--dsw-alias-bg-base'],
    ['--dsw-alias-label-secondary', '--dsw-alias-bg-base'],
    ['--dsw-alias-label-tertiary', '--dsw-alias-bg-base'],
    ['--dsw-alias-label-primary', '--dsw-alias-bg-overlay'],
    ['--dsw-alias-link', '--dsw-alias-bg-base'],
    ['--dsw-alias-state-error-primary', '--dsw-alias-bg-base'],
  ]
  for (const [fg, bg] of pairs) {
    const ratio = contrast(t[fg].light, t[bg].light)
    assert.ok(ratio >= 4.5, `${fg} on ${bg} in light mode is ${ratio.toFixed(2)}:1, needs 4.5:1`)
  }
  const darkPairs = [
    ['--dsw-alias-label-primary', '--dsw-alias-bg-base'],
    ['--dsw-alias-label-secondary', '--dsw-alias-bg-base'],
    ['--dsw-alias-label-tertiary', '--dsw-alias-bg-layer-2'],
    ['--dsw-alias-brand-primary', '--dsw-alias-bg-base'],
    ['--dsw-alias-link', '--dsw-alias-bg-base'],
    ['--dsw-alias-state-success-primary', '--dsw-alias-bg-base'],
    ['--dsw-alias-state-error-primary', '--dsw-alias-bg-base'],
  ]
  for (const [fg, bg] of darkPairs) {
    const ratio = contrast(t[fg].dark, t[bg].dark)
    assert.ok(ratio >= 4.5, `${fg} on ${bg} in dark mode is ${ratio.toFixed(2)}:1, needs 4.5:1`)
  }
})

test('squares every corner in the injected stylesheet', async () => {
  const { calls } = await boot()
  const css = calls.css.join('\n')
  assert.ok(css.length > 0, 'apply must insert its own stylesheet')
  const radii = [...css.matchAll(/border-radius:\s*([^;!}]+)/g)].map((m) => m[1].trim())
  assert.ok(radii.length > 0, 'the sheet must set border-radius')
  for (const value of radii) {
    assert.ok(
      value === '0' || value === '0px' || value === 'var(--kat-radius)',
      `non-square radius in sheet: ${value}`,
    )
  }
  assert.match(css, /--kat-radius:\s*0/)
  assert.ok(!/border-radius:\s*(?!0|0px|var\(--kat-radius\))/.test(css), 'no rounded corner may survive')
})

test('squares corners with !important, because claude-style rounds with !important', async () => {
  const { calls } = await boot()
  const css = calls.css.join('\n')
  const decls = [...css.matchAll(/border-radius:\s*([^;}]+)/g)].map((m) => m[1].trim())
  assert.ok(decls.length > 0, 'the sheet must set border-radius')
  for (const decl of decls) {
    assert.match(
      decl,
      /^[^;]*!\s*important$/i,
      `border-radius "${decl}" must be !important to outrank claude-style's rounded !important rules`,
    )
  }
})

/** Split a stylesheet into { selector, body } rules (one nesting level). */
function rules(css) {
  const out = []
  const re = /([^{}]+)\{([^{}]*)\}/g
  let m
  while ((m = re.exec(css))) out.push({ selector: m[1].trim(), body: m[2] })
  return out
}

const isProgressSelector = (sel) =>
  /\[role="progressbar"\]/.test(sel) ||
  /\[aria-busy="true"\]/.test(sel) ||
  /svg\[data-state="ongoing"\]/.test(sel)

test('calm narrows iteration count only, so the re-arm can still win', async () => {
  const { calls } = await boot()
  const css = calls.css.join('\n')
  const calm = rules(css).filter((r) => /data-kat-motion="calm"/.test(r.selector))
  assert.ok(calm.length > 0, 'calm rules must exist')

  // `animation:none` and `animation-name:none` both stop the named animation, so
  // on a wildcard they outrank and undo the progress/caret re-arm no matter how
  // specific that re-arm is. Calm may only narrow the iteration count.
  const rewritesName = (body) =>
    /(^|;)\s*animation\s*:/.test(body) || /(^|;)\s*animation-name\s*:/.test(body)
  const isWildcard = (selector) => /(^|[\s,])\*(\s|::(before|after)|,|$)/.test(selector)

  for (const rule of calm) {
    if (!rewritesName(rule.body)) continue
    assert.ok(
      !isWildcard(rule.selector),
      `calm resets the animation on a wildcard, which stops the re-armed cues: ${rule.selector.slice(0, 90)}`,
    )
  }
})

test('calm motion is the default and no endless animation survives it', async () => {
  const { calls } = await boot()
  const css = calls.css.join('\n')
  const attrs = new Map(calls.attrs)
  assert.equal(attrs.get('data-kat-motion'), 'calm')

  const looping = rules(css).filter((r) => /animation[^;]*\binfinite\b/.test(r.body))
  for (const rule of looping) {
    assert.ok(
      isProgressSelector(rule.selector),
      `endless animation is not a progress indicator: ${rule.selector.slice(0, 80)}`,
    )
  }

  const calm = rules(css).filter((r) => /data-kat-motion="calm"/.test(r.selector))
  assert.ok(calm.length > 0, 'calm rules must exist')
  assert.match(css, /prefers-reduced-motion:\s*reduce/)
})

test('calm motion keeps genuine progress indicators alive', async () => {
  const { calls } = await boot()
  const css = calls.css.join('\n')
  const revived = rules(css).filter(
    (r) =>
      isProgressSelector(r.selector) &&
      /data-kat-motion="calm"/.test(r.selector) &&
      /animation-iteration-count:\s*infinite/.test(r.body),
  )
  assert.ok(
    revived.length > 0,
    'a progress indicator must keep spinning under calm, or loading reads as finished',
  )
  assert.ok(
    revived.some((r) => /\[role="progressbar"\]/.test(r.selector)),
    'the progressbar role must be covered',
  )
  assert.ok(
    revived.some((r) => /\[aria-busy="true"\]/.test(r.selector)),
    'the aria-busy state must be covered',
  )
})

test('calm motion leaves the text caret blinking, and never touches its glide', async () => {
  const { calls } = await boot()
  const css = calls.css.join('\n')

  // The caret is an editing cue like a progressbar: stopping its blink makes a
  // focused field look idle. The glide is a `transition`, so calm must not
  // reach for transition-duration outside the reduced-motion block.
  const calm = rules(css).filter((r) => /data-kat-motion="calm"/.test(r.selector))
  for (const rule of calm) {
    assert.ok(
      !/transition/.test(rule.body),
      `calm must not override transitions (breaks the caret glide): ${rule.selector.slice(0, 70)}`,
    )
  }
  assert.ok(
    !/\[data-dsh-claude-caret\]/.test(css),
    'the blinking element is the caret layer, not the hidden native caret',
  )
  // Calm zeroes every infinite animation, so the caret layer has to be named in
  // the re-arm block. Asserting only the absence of a stray selector lets the
  // blanket rule win and the caret go still.
  const rearmed = calm.filter(
    (r) =>
      /\[data-dsh-claude-caret-layer\]/.test(r.selector) &&
      /animation-iteration-count:\s*infinite/.test(r.body),
  )
  assert.ok(
    rearmed.length > 0,
    'calm must re-arm the caret layer to infinite, or a focused field looks idle',
  )
})

test('mono chrome and sans prose are wired to host font tokens', async () => {
  const { calls } = await boot()
  const t = calls.tokens[0].tokens
  const css = calls.css.join('\n')
  const mono = 'JetBrainsMono Nerd Font'
  assert.ok(t['--dsw-font-family'], 'must override the chrome font token')
  assert.ok(t['--dsw-font-family'].dark.includes(mono))
  assert.ok(t['--dsw-font-family'].light.includes(mono))
  assert.match(css, /--kat-font-mono:/)
  assert.match(css, /--kat-font-sans:/)
  assert.equal(t['--dsw-font-markdown-base'].dark.includes(mono), false, 'prose stays sans by default')
})

test('density and prose font are body switches, not new stylesheet loads', async () => {
  const { calls } = await boot()
  const attrs = new Map(calls.attrs)
  assert.equal(attrs.get('data-kat-density'), 'comfortable')
  assert.equal(attrs.get('data-kat-prose'), 'sans')
  assert.equal(attrs.get('data-kat-theme'), '')
  const css = calls.css.join('\n')
  assert.match(css, /data-kat-density="compact"/)
  assert.match(css, /data-kat-prose="mono"[^}]*--kat-font-prose/)
})

test('drives prose through the variable claude-style actually reads', async () => {
  const { calls } = await boot()
  const css = calls.css.join('\n')
  // The markdown element's class is a hashed CSS-module name, so a literal
  // `.markdown` selector never matches; match the stable substring instead.
  assert.ok(!/\s\.markdown[\s,{]/.test(css), 'a literal .markdown selector cannot match a hashed class')
  assert.match(css, /\[class\*=markdown\]/)
  // claude-style paints prose from its own private token, so the prose switch
  // must move that variable, not just declare a font stack.
  assert.match(css, /--dsh-claude-font-prose/)
  assert.match(css, /data-kat-prose="mono"[^}]*--dsh-claude-font-prose/)
  // The default path matters as much as the switch: claude-style reads its own
  // token unconditionally, so the base block has to bind it or prose stays
  // serif no matter what the host markdown token says.
  const base = rules(css).filter((r) => /^body\[data-kat-theme\]/.test(r.selector))
  assert.ok(base.length > 0, 'the base theme block must exist')
  assert.match(
    base[0].body,
    /--kat-font-prose:\s*var\(--kat-font-sans\)/,
    'prose defaults to the sans stack',
  )
  // A plain body[data-kat-theme] block loses to claude-style's own two-attribute
  // declaration, so the binding is inert unless the selector outranks it.
  const winning = rules(css).filter(
    (r) =>
      /--dsh-claude-font-prose:\s*var\(--kat-font-prose\)/.test(r.body) &&
      specificity(r.selector) > CLAUDE_PROSE_DECL_WEIGHT,
  )
  assert.ok(
    winning.length > 0,
    `a prose binding must outrank claude-style's own declaration (weights above ${CLAUDE_PROSE_DECL_WEIGHT})`,
  )
  assert.match(
    winning[0].body,
    /--dsh-claude-font-serif:\s*var\(--kat-font-prose\)/,
    'serif must be bound too, since claude-style may prefer it',
  )
  // The mono switch has to win for the same reason.
  const monoWin = rules(css).filter(
    (r) =>
      /data-kat-prose="mono"/.test(r.selector) &&
      /--dsh-claude-font-prose:\s*var\(--kat-font-mono\)/.test(r.body) &&
      specificity(r.selector.replace(/=("|')?mono\1?/g, '')) >= CLAUDE_PROSE_DECL_WEIGHT,
  )
  assert.ok(monoWin.length > 0, 'the mono prose switch must outrank claude-style too')
})

test('registers the settings page with its five controls', async () => {
  const { calls } = await boot()
  const page = calls.slots.find((s) => s.options.name === 'settings.section')
  assert.ok(page, 'must register a settings.section page')
  assert.equal(page.options.id, 'custom-dsh-theme')
  assert.equal(typeof page.options.label, 'function')
  assert.match(page.options.label(), /Custom DSH Theme/i)
  const tree = page.component({ close() {} })
  const text = JSON.stringify(tree)
  for (const word of ['Accent', 'Density', 'Motion', 'Prose', 'Reset']) {
    assert.match(text, new RegExp(word, 'i'), `settings page must offer ${word}`)
  }
})

test('works without dsh-claude-style: only documented host tokens are written', async () => {
  const { calls } = await boot()
  const t = calls.tokens[0].tokens
  for (const name of Object.keys(t)) {
    assert.match(name, /^--(dsw-(alias|specific|static|menu|radius|font|shadow)-|ds-font-family-code$)/, `undocumented token ${name}`)
  }
  assert.ok(t['--dsw-radius-sm'] && t['--dsw-radius-md'] && t['--dsw-radius-lg'] && t['--dsw-radius-xl'])
  for (const name of ['--dsw-radius-xs', '--dsw-radius-sm', '--dsw-radius-md', '--dsw-radius-lg', '--dsw-radius-xl', '--dsw-radius-panel']) {
    assert.equal(t[name].dark, '0', `${name} must be square in dark mode`)
    assert.equal(t[name].light, '0', `${name} must be square in light mode`)
  }
})

test('never touches a service it did not declare', async () => {
  const source = await readFile(path.join(ROOT, 'client.js'), 'utf8')
  assert.ok(
    !/ctx\.styles/.test(source),
    'ctx.styles is a dynamic-package builtin; a static bundle must not read it',
  )

  // Model the real loader: an undeclared service throws on property access.
  let registration = null
  const sandbox = {
    console,
    document: {
      body: { setAttribute() {}, removeAttribute() {}, getAttribute: () => null, style: {} },
      documentElement: { style: {}, setAttribute() {}, removeAttribute() {} },
      createElement: (tag) => ({ tagName: String(tag).toUpperCase(), textContent: '', style: {}, remove() {} }),
      head: { append() {}, appendChild() {} },
      querySelector: () => null,
    },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    setTimeout,
    clearTimeout,
  }
  sandbox.window = sandbox
  sandbox.globalThis = sandbox
  sandbox.window.__ModuleLoader__ = { load: (def) => { registration = def } }
  vm.createContext(sandbox)
  vm.runInContext(source, sandbox, { filename: 'client.js' })

  const React = { createElement: () => ({}), useState: () => [0, () => {}], useEffect: () => {} }
  const mod = registration.factory((n) => {
    if (n === 'react') return React
    throw new Error(`unexpected require: ${n}`)
  })

  const declared = new Set(mod.inject)
  const realCtx = {
    theme: { overrideTokens: () => () => {} },
    slots: { inject: () => () => {}, register: () => () => {} },
    effect: (fn) => { const d = fn(); return typeof d === 'function' ? d : () => {} },
    get: () => undefined,
    on: () => () => {},
  }
  const guarded = new Proxy(realCtx, {
    get(target, prop) {
      if (prop in target) return target[prop]
      if (typeof prop === 'string' && !declared.has(prop)) {
        throw new Error(`cannot get property "${prop}" without inject`)
      }
      return undefined
    },
  })

  assert.doesNotThrow(() => mod.apply(guarded), 'apply must survive a strict loader context')
})

test('re-asserts the token layer when the host snapshot stops carrying it', async () => {
  const { calls } = await boot()
  const handler = calls.events.find((event) => event.name === 'theme/change')
  assert.ok(handler, 'the skin must subscribe to theme/change')

  const before = calls.tokens.length
  handler.fn({ preference: 'dark', active: { colorScheme: 'dark', tokens: {} } })
  assert.ok(calls.tokens.length > before, 'a layer the host dropped must be re-asserted')

  const restored = calls.tokens[calls.tokens.length - 1]
  assert.equal(restored.source, 'custom-dsh-theme')
  assert.equal(restored.tokens['--dsw-alias-label-tertiary'].dark, '#8a8a8a')
})

test('leaves an intact layer alone so a scheme flip does not thrash', async () => {
  const { calls } = await boot()
  const handler = calls.events.find((event) => event.name === 'theme/change')
  const layer = calls.tokens[0]
  const sentinel = '--dsw-alias-label-tertiary'

  const composed = Object.fromEntries(
    Object.entries(layer.tokens).map(([name, pair]) => [name, pair.light]),
  )

  const before = calls.tokens.length
  handler.fn({ preference: 'light', active: { colorScheme: 'light', tokens: composed } })
  assert.equal(calls.tokens.length, before, 'an intact layer must not be restacked')
})

test('teardown releases the theme/change subscription', async () => {
  const { calls } = await boot()
  const handler = calls.events.find((event) => event.name === 'theme/change')
  for (const dispose of calls.disposers) dispose()

  assert.equal(handler.off, true, 'the subscription must be released on teardown')
})

test('avatar circles are not exempt from the square rule', async () => {
  const { calls } = await boot()
  const css = calls.css.join('\n')
  assert.ok(!/border-radius:\s*50%/.test(css))
  assert.ok(!/border-radius:\s*999/.test(css))
})

test('the session spinner is a square chase that survives calm and reduced motion', async () => {
  const { calls } = await boot()
  const css = calls.css.join('\n')
  assert.match(css, /@keyframes kat-spin-chase/, 'the spinner must use the square chase keyframes')

  const chase = rules(css).filter(
    (r) => /svg\[data-state="ongoing"\]/.test(r.selector) && /kat-spin-chase/.test(r.body),
  )
  assert.ok(chase.length > 0, 'the working spinner must run the chase animation')
  assert.ok(
    chase.some((r) => !/data-kat-motion="calm"/.test(r.selector)),
    'the chase must run in the base sheet, not only under one motion pref',
  )

  const calmRearm = rules(css).filter(
    (r) =>
      /data-kat-motion="calm"/.test(r.selector) &&
      /svg\[data-state="ongoing"\]/.test(r.selector) &&
      /animation-iteration-count:\s*infinite/.test(r.body),
  )
  assert.ok(
    calmRearm.length > 0,
    'calm zeroes every animation; the spinner must be re-armed or a working session looks finished',
  )

  const reduced = rules(css).filter(
    (r) =>
      /prefers-reduced-motion/.test(r.selector) ||
      /svg\[data-state="ongoing"\]/.test(r.selector),
  )
  assert.ok(
    /animation-name:\s*kat-spin-chase/.test(css),
    'reduced motion must name the chase explicitly, or animation:none wins and it stops',
  )
})

test('the effort picker becomes a sliding segmented bar with accent fill and spring knob', async () => {
  const { calls } = await boot()
  const css = calls.css.join('\n')

  const bar = rules(css).filter((r) => /\[data-kat-effort-bar\]/.test(r.selector))
  assert.ok(bar.length > 0, 'the effort bar layout must be scoped to the enhanced menu')
  assert.ok(
    bar.some((r) => /display:\s*flex/.test(r.body) && /flex-direction:\s*row/.test(r.body)),
    'effort options must lay out as a horizontal bar, not the host vertical list',
  )
  assert.ok(
    bar.some((r) => /min-width:\s*0/.test(r.body)),
    'the host sets min-width:100% on rows; without min-width:0 the segments cannot shrink and overflow',
  )
  assert.ok(
    bar.some((r) => /min-width:\s*min\(3[0-9]{2}px/.test(r.body)),
    'the bar must be wide enough for the longest label; at host width "Default" ellipsizes',
  )

  const pill = rules(css).filter((r) => /\.kat-effort-pill/.test(r.selector))
  assert.ok(pill.length > 0, 'the sliding indicator must exist')
  assert.ok(
    pill.some((r) => /transition:[^;]*transform/.test(r.body) && /cubic-bezier/.test(r.body)),
    'the indicator must slide (transform transition) with an eased curve',
  )
  assert.ok(
    pill.some((r) => /pointer-events:\s*none/.test(r.body)),
    'the indicator must never intercept clicks meant for the options',
  )

  const fill = rules(css).filter((r) => /\.dsh-claude-effort-fill/.test(r.selector))
  assert.ok(
    fill.some((r) => /var\(--dsw-alias-brand-primary/.test(r.body)),
    'the slider fill must carry the theme accent',
  )

  const knob = rules(css).filter((r) => /\.dsh-claude-effort-knob/.test(r.selector))
  assert.ok(
    knob.some((r) => /translate[^;]*cubic-bezier\([^)]*,\s*1\.\d+/.test(r.body)),
    'the knob must travel with an overshoot ease so it settles with a pop',
  )
})

test('the effort enhancer never targets the permission popover', async () => {
  const { calls, module } = await boot()
  assert.equal(typeof module.apply, 'function')
  // The enhancer is DOM-driven and degrades silently without MutationObserver;
  // booting the harness (no MutationObserver in the sandbox) must not throw.
  const { readFile } = await import('node:fs/promises')
  const src = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.ok(
    /dsh-claude-perm-popover/.test(src),
    'the enhancer must explicitly exclude the permission popover from the bar treatment',
  )
  assert.ok(
    /menuitemradio/.test(src),
    'the enhancer must key on menuitemradio options, not the model list items',
  )
})
