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

/**
 * Boot the browser module in a sandbox with a recording context. Returns the
 * observed §calls so tests assert behaviour, not internals.
 */
async function boot() {
  const source = await readFile(path.join(ROOT, 'client.js'), 'utf8')
  let registration = null
  const calls = { tokens: [], css: [], slots: [], attrs: [], events: [] }

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
    on: () => () => {},
    effect: (fn) => {
      const dispose = fn()
      return typeof dispose === 'function' ? dispose : () => {}
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

/** Split a stylesheet into { selector, body } rules (one nesting level). */
function rules(css) {
  const out = []
  const re = /([^{}]+)\{([^{}]*)\}/g
  let m
  while ((m = re.exec(css))) out.push({ selector: m[1].trim(), body: m[2] })
  return out
}

const isProgressSelector = (sel) =>
  /\[role="progressbar"\]/.test(sel) || /\[aria-busy="true"\]/.test(sel)

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
  assert.equal(t['--dsw-radius-sm'].dark, '0')
  assert.equal(t['--dsw-radius-panel'].dark, '0')
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

test('avatar circles are not exempt from the square rule', async () => {
  const { calls } = await boot()
  const css = calls.css.join('\n')
  assert.ok(!/border-radius:\s*50%/.test(css))
  assert.ok(!/border-radius:\s*999/.test(css))
})
