/**
 * Client half of the personal square-minimal theme.
 *
 * Paint goes through ctx.theme.overrideTokens: the host writes those values
 * inline on <body>, above any stylesheet, so one layer repaints every surface
 * including dsh-claude-style's. Shape, type and density go through one owned
 * stylesheet, because radii are not tokens here.
 */
window.__ModuleLoader__.load({
  id: 'custom-dsh-theme',
  factory(require) {
    const React = require('react')

    const SOURCE = 'custom-dsh-theme'
    const PREF_KEY = 'custom-dsh-theme.prefs'

    const MONO =
      "'JetBrainsMono Nerd Font','JetBrainsMono NF','JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace"
    const SANS =
      "ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif"

    const ACCENTS = {
      sky: {
        dark: { brand: '#7dd3fc', hover: '#38bdf8', deep: '#7dd3fc', ink: '#04121a', soft: '#7dd3fc29' },
        light: { brand: '#0369a1', hover: '#075985', deep: '#0c4a6e', ink: '#ffffff', soft: '#0369a129' },
      },
      emerald: {
        dark: { brand: '#6ee7a8', hover: '#4ade80', deep: '#6ee7a8', ink: '#04150c', soft: '#6ee7a829' },
        light: { brand: '#047857', hover: '#065f46', deep: '#064e3b', ink: '#ffffff', soft: '#04785729' },
      },
      mono: {
        dark: { brand: '#e5e5e5', hover: '#ffffff', deep: '#e5e5e5', ink: '#000000', soft: '#e5e5e529' },
        light: { brand: '#1a1a1a', hover: '#000000', deep: '#1a1a1a', ink: '#ffffff', soft: '#1a1a1a29' },
      },
    }

    /**
     * Substrates. Pure black is a mood, not a default: at full-screen size it
     * flattens every raised surface into one void. Each entry is the same ramp
     * with a different floor, so panels keep a visible step above the page
     * without turning grey. Light mode is untouched by this choice.
     */
    const SURFACES = {
      amoled: {
        base: '#000000',
        l1: '#0a0a0a',
        l2: '#0e0e0e',
        l3: '#131313',
        overlay: '#101010',
        raised: '#141414',
        hover: '#181818',
        chip: '#1a1a1a',
        border1: '#1f1f1f',
        border3: '#2a2a2a',
        border4: '#333333',
      },
      soft: {
        base: '#0b0b0c',
        l1: '#101012',
        l2: '#141417',
        l3: '#191a1d',
        overlay: '#17181b',
        raised: '#1c1d21',
        hover: '#232429',
        chip: '#26272b',
        border1: '#2a2b31',
        border3: '#3a3b42',
        border4: '#4a4b53',
      },
      warm: {
        base: '#0d0b0a',
        l1: '#12100e',
        l2: '#171412',
        l3: '#1d1a17',
        overlay: '#1b1815',
        raised: '#211d19',
        hover: '#2a2521',
        chip: '#2b2723',
        border1: '#302b26',
        border3: '#403a34',
        border4: '#514a43',
      },
    }

    const DEFAULTS = { accent: 'sky', surface: 'soft', density: 'comfortable', motion: 'calm', prose: 'sans' }

    function readPrefs(store) {
      const prefs = { ...DEFAULTS }
      try {
        const raw = store && store.getItem(PREF_KEY)
        if (!raw) return prefs
        const parsed = JSON.parse(raw)
        if (ACCENTS[parsed.accent]) prefs.accent = parsed.accent
        if (SURFACES[parsed.surface]) prefs.surface = parsed.surface
        if (parsed.density === 'compact' || parsed.density === 'comfortable') prefs.density = parsed.density
        if (parsed.motion === 'full' || parsed.motion === 'calm') prefs.motion = parsed.motion
        if (parsed.prose === 'mono' || parsed.prose === 'sans') prefs.prose = parsed.prose
      } catch {
        /* a corrupt or unavailable store keeps the defaults */
      }
      return prefs
    }

    function writePrefs(store, prefs) {
      try {
        if (!store) return false
        store.setItem(PREF_KEY, JSON.stringify(prefs))
        return true
      } catch {
        return false
      }
    }

    /**
     * The ramp is written once with amoled values; a substrate swap is a
     * lookup on the exact colours, so every surface token (panels, menus,
     * hairlines, code blocks) moves together without hand-editing 126 entries.
     * Tinted semantic colours and alpha masks are left alone on purpose.
     */
    const RAMP_KEYS = {
      '#000000': 'base',
      '#0a0a0a': 'l1',
      '#0e0e0e': 'l2',
      '#101010': 'overlay',
      '#111111': 'l2',
      '#131313': 'l3',
      '#141414': 'raised',
      '#161616': 'raised',
      '#181818': 'hover',
      '#1a1a1a': 'chip',
      '#222222': 'hover',
      '#1f1f1f': 'border1',
      '#2a2a2a': 'border3',
      '#333333': 'border4',
    }

    function retint(tokens, surfaceId) {
      if (surfaceId === 'amoled' || !SURFACES[surfaceId]) return tokens
      const stops = SURFACES[surfaceId]
      const out = {}
      for (const [name, pair] of Object.entries(tokens)) {
        const stop = RAMP_KEYS[pair.dark]
        out[name] = stop ? { dark: stops[stop], light: pair.light } : pair
      }
      return out
    }

    /** Both palette modes for every token this theme repaints. */
    function buildTokens(accentId, surfaceId) {
      const a = ACCENTS[accentId] || ACCENTS.sky
      const d = a.dark
      const l = a.light
      const pair = (dark, light) => ({ dark, light })

      const tokens = {
        '--dsw-alias-bg-base': pair('#000000', '#f4f4f2'),
        '--dsw-alias-bg-layer-1': pair('#0a0a0a', '#fafaf8'),
        '--dsw-alias-bg-layer-2': pair('#0e0e0e', '#ffffff'),
        '--dsw-alias-bg-layer-3': pair('#131313', '#ffffff'),
        '--dsw-alias-bg-overlay': pair('#101010', '#ffffff'),
        '--dsw-alias-bg-module-platform': pair('#0e0e0e', '#ececea'),
        '--dsw-alias-bg-multi-select': pair('#141414', '#ececea'),
        '--dsw-alias-bg-skeleton': pair('#ffffff0a', '#0000000a'),
        '--dsw-alias-bg-mask-1': pair('#00000080', '#0000003d'),
        '--dsw-alias-bg-mask-2': pair('#00000033', '#0000001f'),
        '--dsw-alias-bg-mask-3': pair('#0000007a', '#0000007a'),
        '--dsw-alias-bg-mask-photo': pair('#000000e0', '#000000e0'),
        '--dsw-alias-bg-mask-drop': pair('#101014b3', '#ffffffb3'),
        '--dsw-alias-bg-document-preview': pair('#0a0a0a', '#fafaf8'),
        '--dsw-alias-bg-document-selection': pair('#7dd3fc33', '#0369a133'),
        '--dsw-alias-border-l1': pair('#1f1f1f', '#dedcd8'),
        '--dsw-alias-border-l2': pair('#1f1f1f', '#d8d6d2'),
        '--dsw-alias-border-l2-darkmode-thin': pair('#1a1a1a', '#d8d6d2'),
        '--dsw-alias-border-l3': pair('#2a2a2a', '#c8c6c1'),
        '--dsw-alias-border-l4': pair('#333333', '#b8b6b0'),
        '--dsw-alias-border-inverted': pair('#ffffff14', '#00000014'),
        '--dsw-alias-border-inverted2': pair('#ffffff14', '#00000014'),
        '--dsw-alias-label-primary': pair('#f2f2f2', '#101010'),
        '--dsw-alias-label-primary-bluish': pair('#f2f2f2', '#101010'),
        '--dsw-alias-label-primary-dimmed': pair('#d4d4d4', '#2a2a2a'),
        '--dsw-alias-label-primary-foreground': pair('#000000', '#ffffff'),
        '--dsw-alias-label-primary-inverted': pair('#0e0e0e', '#ffffff'),
        '--dsw-alias-label-secondary': pair('#a3a3a3', '#4a4a48'),
        '--dsw-alias-label-tertiary': pair('#8a8a8a', '#5c5c5a'),
        '--dsw-alias-label-caption': pair('#7a7a7a', '#6a6a68'),
        '--dsw-alias-label-dimmed': pair('#6b6b6b', '#8a8a88'),
        '--dsw-alias-label-shimmer': pair('#f2f2f24d', '#1010104d'),
        '--dsw-alias-label-deep-diving': pair(d.deep, l.brand),
        '--dsw-alias-label-deep-diving-shimmer': pair(d.hover, l.hover),
        '--dsw-alias-label-document-preview': pair('#d4d4d4', '#2a2a2a'),
        '--dsw-alias-menu-icon': pair('#cfcfcf', '#3a3a38'),
        '--dsw-alias-brand-primary': pair(d.brand, l.brand),
        '--dsw-alias-brand-primary-invert': pair('#f2f2f2', '#101010'),
        '--dsw-alias-brand-primary-new-colorprimary-new-color': pair(d.brand, l.brand),
        '--dsw-alias-brand-text': pair(d.ink, l.ink),
        '--dsw-alias-button-primary-fill': pair(d.brand, l.brand),
        '--dsw-alias-button-primary-hover': pair(d.hover, l.hover),
        '--dsw-alias-button-primary-dimmed': pair('#12303f', '#dbe9f2'),
        '--dsw-alias-button-info-fill': pair(d.brand, l.brand),
        '--dsw-alias-button-info-hover': pair(d.hover, l.hover),
        '--dsw-alias-button-elevated-fill': pair('#141414', '#ffffff'),
        '--dsw-alias-button-floating-fill': pair('#101010', '#ffffff'),
        '--dsw-alias-button-floating-hover': pair('#181818', '#f0f0ee'),
        '--dsw-alias-button-contrast-fill': pair('#f2f2f2', '#101010'),
        '--dsw-alias-button-ghost-active-fill': pair('#181818', '#ececea'),
        '--dsw-alias-button-ghost-active-border': pair('#333333', '#b8b6b0'),
        '--dsw-alias-button-ghost-active-hover': pair('#222222', '#e4e2de'),
        '--dsw-alias-button-tool-bar-fill': pair('#ffffff14', '#00000010'),
        '--dsw-alias-button-tool-bar-fill-invisible': pair('#ffffff00', '#00000000'),
        '--dsw-alias-button-tool-bar-hover': pair('#ffffff24', '#0000001f'),
        '--dsw-alias-interactive-bg-hover': pair('#ffffff0d', '#0000000a'),
        '--dsw-alias-interactive-bg-hover-solid': pair('#181818', '#ececea'),
        '--dsw-alias-interactive-bg-hover-accent': pair(d.soft, l.soft),
        '--dsw-alias-interactive-bg-hover-danger': pair('#f8717124', '#b91c1c14'),
        '--dsw-alias-interactive-bg-active': pair('#ffffff1a', '#00000014'),
        '--dsw-alias-link': pair(d.brand, l.brand),
        '--dsw-alias-markdown-code-block': pair('#0a0a0a', '#f6f6f4'),
        '--dsw-alias-markdown-code-block-banner': pair('#111111', '#f0f0ee'),
        '--dsw-alias-markdown-inline-code': pair('#1a1a1a', '#eae8e4'),
        '--dsw-alias-markdown-citation': pair('#141414', '#ececea'),
        '--dsw-alias-markdown-placeholder': pair('#1a1a1a', '#ececea'),
        '--dsw-alias-markdown-tag': pair('#141414', '#eae8e4'),
        '--dsw-alias-markdown-code-segment-selected': pair('#181818', '#ffffff'),
        '--dsw-alias-markdown-code-segment-unselected': pair('#0e0e0e', '#f0f0ee'),
        '--dsw-alias-state-business-primary': pair(d.brand, l.brand),
        '--dsw-alias-state-business-tertiary': pair('#12303f', '#e0edf4'),
        '--dsw-alias-state-success-primary': pair('#6ee7a8', '#047857'),
        '--dsw-alias-state-success-secondary': pair('#4ade80', '#059669'),
        '--dsw-alias-state-success-tertiary': pair('#0d2a1c', '#d7f0e4'),
        '--dsw-alias-state-error-primary': pair('#f87171', '#b91c1c'),
        '--dsw-alias-state-error-secondary': pair('#ef4444', '#dc2626'),
        '--dsw-alias-state-warn-primary': pair('#fbbf24', '#b45309'),
        '--dsw-alias-state-warn-secondary': pair('#f59e0b', '#d97706'),
        '--dsw-alias-state-warn-label': pair('#fbbf24', '#92400e'),
        '--dsw-alias-state-warn-tertiary': pair('#2a2110', '#f7ecd9'),
        '--dsw-alias-state-idle-primary': pair('#4a4a4a', '#a8a6a2'),
        '--dsw-alias-code-diff-added': pair('#4ade801f', '#04785714'),
        '--dsw-alias-code-diff-deleted': pair('#f871711f', '#b91c1c14'),
        '--dsw-alias-file-diff-added-bg': pair('#0e2018', '#e8f5ee'),
        '--dsw-alias-file-diff-added-gutter': pair('#0a1812', '#dff0e7'),
        '--dsw-alias-file-diff-added-marker': pair('#4ade80', '#047857'),
        '--dsw-alias-file-diff-deleted-bg': pair('#241010', '#fbe9e7'),
        '--dsw-alias-file-diff-deleted-gutter': pair('#1a0b0b', '#f6ddda'),
        '--dsw-alias-file-diff-deleted-marker': pair('#f87171', '#b91c1c'),
        '--dsw-alias-scrollbar-bg-l1': pair('#1f1f1f', '#d8d6d2'),
        '--dsw-alias-scrollbar-bg-l2': pair('#1f1f1f', '#d8d6d2'),
        '--dsw-alias-scrollbar-hover-l1': pair('#333333', '#b8b6b0'),
        '--dsw-alias-scrollbar-hover-l2': pair('#333333', '#b8b6b0'),
        '--dsw-alias-switch-thumb': pair('#f2f2f2', '#ffffff'),
        '--dsw-alias-toast-bg': pair('#1a1a1a', '#101010'),
        '--dsw-alias-toast-label': pair('#f2f2f2', '#ffffff'),
        '--dsw-alias-tooltip-bg': pair('#1a1a1a', '#101010'),
        '--dsw-alias-tooltip-key-bg': pair('#2a2a2a', '#2a2a2a'),
        '--dsw-alias-turn-trigger-bg': pair('#0e0e0e', '#ececea'),
        '--dsw-alias-turn-trigger-bg-hover': pair('#181818', '#e4e2de'),
        '--dsw-menu-surface-fill': pair('#101010', '#ffffff'),
        '--dsw-alias-menu-group-header-fill': pair('#101010f2', '#ffffff'),
        '--dsw-specific-menu': pair('#101010', '#ffffff'),
        '--dsw-specific-bubble': pair('#141414', '#ececea'),
        '--dsw-specific-bubble-highlight': pair('#1f1f1f', '#e4e2de'),
        '--dsw-specific-input-major': pair('#0a0a0a', '#ffffff'),
        '--dsw-specific-login-input': pair('#0e0e0e', '#fafaf8'),
        '--dsw-specific-selector': pair('#141414', '#ececea'),
        '--dsw-specific-sidebar-fill': pair('#000000', '#efefec'),
        '--dsw-specific-sidebar-nav-item-active': pair('#1a1a1a', '#e4e2de'),
        '--dsw-specific-sidebar-nav-item-active-accent': pair('#222222', '#d8d6d2'),
        '--dsw-specific-sidebar-nav-item-hover': pair('#141414', '#e8e6e2'),
        '--dsw-specific-tip': pair('#161616', '#e4e2de'),
        '--dsw-font-family': pair(MONO, MONO),
        '--ds-font-family-code': pair(MONO, MONO),
        '--dsw-font-markdown-base': pair(
          'var(--dsh-content-font-size,14px) / calc(24px + var(--dsh-content-font-delta)) var(--kat-font-prose)',
          'var(--dsh-content-font-size,14px) / calc(24px + var(--dsh-content-font-delta)) var(--kat-font-prose)',
        ),
        '--dsw-font-markdown-base-strong': pair(
          '600 var(--dsh-content-font-size,14px) / calc(24px + var(--dsh-content-font-delta)) var(--kat-font-prose)',
          '600 var(--dsh-content-font-size,14px) / calc(24px + var(--dsh-content-font-delta)) var(--kat-font-prose)',
        ),
        '--dsw-font-markdown-h1': pair(
          '700 calc(21px + var(--dsh-content-font-delta)) / calc(30px + var(--dsh-content-font-delta)) var(--kat-font-prose)',
          '700 calc(21px + var(--dsh-content-font-delta)) / calc(30px + var(--dsh-content-font-delta)) var(--kat-font-prose)',
        ),
        '--dsw-font-markdown-h2': pair(
          '700 calc(19px + var(--dsh-content-font-delta)) / calc(28px + var(--dsh-content-font-delta)) var(--kat-font-prose)',
          '700 calc(19px + var(--dsh-content-font-delta)) / calc(28px + var(--dsh-content-font-delta)) var(--kat-font-prose)',
        ),
        '--dsw-font-markdown-h3': pair(
          '700 calc(18px + var(--dsh-content-font-delta)) / calc(26px + var(--dsh-content-font-delta)) var(--kat-font-prose)',
          '700 calc(18px + var(--dsh-content-font-delta)) / calc(26px + var(--dsh-content-font-delta)) var(--kat-font-prose)',
        ),
        '--dsw-font-markdown-h4': pair(
          '600 var(--dsh-content-font-size,14px) / calc(24px + var(--dsh-content-font-delta)) var(--kat-font-prose)',
          '600 var(--dsh-content-font-size,14px) / calc(24px + var(--dsh-content-font-delta)) var(--kat-font-prose)',
        ),
        '--dsw-radius-xs': pair('0', '0'),
        '--dsw-radius-sm': pair('0', '0'),
        '--dsw-radius-md': pair('0', '0'),
        '--dsw-radius-lg': pair('0', '0'),
        '--dsw-radius-xl': pair('0', '0'),
        '--dsw-radius-panel': pair('0', '0'),
      }
      return retint(tokens, surfaceId)
    }

    /* Three attribute repeats: claude-style ships !important radii at high
       class specificity, so the square rule must outrank it without editing it. */
    const K = 'html:root body[data-kat-theme][data-kat-theme][data-kat-theme]'

    /* ---- Thinking orb -----------------------------------------------------
       A dotted sphere: points on a Fibonacci lattice, turned about a tilted
       axis and shaded by depth. Two tuned presets rather than one scaled
       design, because a 14px row indicator and a 56px boot orb want different
       dot counts and different dot weights. Inspired by thinking-orbs (MIT,
       Jakub Antalik); drawn here on a plain 2D canvas so the bundle keeps its
       no-dependencies promise. */
    const ORB_PRESETS = {
      sm: { dots: 12, weight: 0.09, speed: 0.9, tilt: 0.62 },
      lg: { dots: 64, weight: 0.018, speed: 0.55, tilt: 0.5 },
    }
    const ORB_SCALE = 0.84

    /**
     * `playful` turns the mascot orb into a character rather than a status
     * light: it bobs on its own rhythm, breathes a few percent, and sheds
     * sparks on expanding orbits. Kept opt-in so sixteen of them in a session
     * list stay still.
     */
    function orbSparks(t, size) {
      const sparks = []
      for (let i = 0; i < 3; i++) {
        const phase = (t * 0.34 + i / 3) % 1
        const angle = t * 0.55 + i * ((Math.PI * 2) / 3)
        const radius = size * (0.3 + phase * 0.2)
        sparks.push({
          x: size / 2 + Math.cos(angle) * radius,
          y: size / 2 + Math.sin(angle) * radius,
          r: Math.max(0.5, size * 0.018 * (1 - phase)),
          a: (1 - phase) * 0.6,
        })
      }
      return sparks
    }

    function orbDots(t, size, options) {
      const playful = options !== undefined && options.playful === true
      const preset = size <= 24 ? ORB_PRESETS.sm : ORB_PRESETS.lg
      const n = preset.dots
      const c = size / 2
      const radius = c * ORB_SCALE
      const turn = t * preset.speed
      const ca = Math.cos(turn)
      const sa = Math.sin(turn)
      const ct = Math.cos(preset.tilt)
      const st = Math.sin(preset.tilt)
      const dots = []
      for (let i = 0; i < n; i++) {
        const y = 1 - (2 * (i + 0.5)) / n
        const ring = Math.sqrt(Math.max(0, 1 - y * y))
        const phi = i * Math.PI * (3 - Math.sqrt(5))
        const x0 = Math.cos(phi) * ring
        const z0 = Math.sin(phi) * ring
        const x1 = x0 * ca - z0 * sa
        const z1 = x0 * sa + z0 * ca
        const y1 = y * ct - z1 * st
        const z2 = y * st + z1 * ct
        const depth = (z2 + 1) / 2
        dots.push({
          x: c + x1 * radius,
          y: c - y1 * radius,
          r: Math.max(0.4, size * preset.weight * (0.55 + depth * 0.9)),
          a: 0.16 + depth * 0.84,
        })
      }
      return {
        size,
        dots,
        bob: playful ? Math.sin(t * 1.7) * size * 0.022 : 0,
        breathe: playful ? 1 + Math.sin(t * 1.15) * 0.034 : 1,
        sparks: playful ? orbSparks(t, size) : [],
      }
    }

    function orbInk() {
      try {
        const value = getComputedStyle(document.body).getPropertyValue('--dsw-alias-label-primary')
        if (value && value.trim()) return value.trim()
      } catch {
        /* computed style unavailable: fall through to a literal */
      }
      return '#f2f2f2'
    }

    /** Returns { element, dispose } or null when the platform cannot draw. */
    function createOrb(size, label, options) {
      try {
        if (typeof document === 'undefined' || typeof document.createElement !== 'function') return null
        const canvas = document.createElement('canvas')
        if (!canvas || typeof canvas.getContext !== 'function') return null
        const ctx2d = canvas.getContext('2d')
        if (!ctx2d) return null

        // Retina sharpness without paying 3x on a low-dpi projector.
        const dpr = Math.min(typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, 2)
        canvas.className = 'kat-orb'
        canvas.setAttribute('data-kat-orb', '')
        canvas.setAttribute('role', 'img')
        canvas.setAttribute('aria-label', label || 'Working')
        canvas.width = Math.round(size * dpr)
        canvas.height = Math.round(size * dpr)
        canvas.style.width = `${size}px`
        canvas.style.height = `${size}px`
        ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0)

        const draw = (t) => {
          const frame = orbDots(t, size, options)
          ctx2d.clearRect(0, 0, size, size)
          ctx2d.fillStyle = orbInk()
          const c = size / 2
          ctx2d.save()
          // Bob and breathe around the orb's own centre, never the canvas corner.
          ctx2d.translate(c, c + frame.bob)
          ctx2d.scale(frame.breathe, frame.breathe)
          ctx2d.translate(-c, -c)
          for (const dot of frame.dots) {
            ctx2d.globalAlpha = dot.a
            ctx2d.beginPath()
            ctx2d.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2)
            ctx2d.fill()
          }
          for (const spark of frame.sparks) {
            ctx2d.globalAlpha = spark.a
            ctx2d.beginPath()
            ctx2d.arc(spark.x, spark.y, spark.r, 0, Math.PI * 2)
            ctx2d.fill()
          }
          ctx2d.restore()
          ctx2d.globalAlpha = 1
        }

        const still =
          typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
        if (still || typeof requestAnimationFrame !== 'function') {
          draw(0.65)
          return { element: canvas, dispose() {} }
        }

        let frame = 0
        let startedAt = 0
        let visible = true
        const step = (now) => {
          if (!visible) return
          if (!startedAt) startedAt = now
          draw((now - startedAt) / 1000)
          frame = requestAnimationFrame(step)
        }
        frame = requestAnimationFrame(step)

        // The sidebar keeps every session row mounted, so an orb that never
        // stops animating off-screen costs battery for nothing.
        let observer = null
        if (typeof IntersectionObserver === 'function') {
          observer = new IntersectionObserver((entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting && !visible) {
                visible = true
                startedAt = 0
                frame = requestAnimationFrame(step)
              } else if (!entry.isIntersecting && visible) {
                visible = false
                cancelAnimationFrame(frame)
              }
            }
          })
          observer.observe(canvas)
        }

        return {
          element: canvas,
          dispose() {
            visible = false
            if (observer) observer.disconnect()
            if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame)
            if (canvas.remove) canvas.remove()
          },
        }
      } catch {
        return null
      }
    }

    function stylesheet() {
      return `
body[data-kat-theme]{
  --kat-radius:0;
  --kat-font-mono:${MONO};
  --kat-font-sans:${SANS};
  --kat-font-prose:var(--kat-font-sans);
  --kat-prose-gap:18px;
  --kat-row-pad:9px;
}
/* claude-style declares its own prose variables on a two-attribute body
   selector, so a plain body block loses the cascade and prose stays serif.
   This repeats attributes to outrank that declaration. */
${K}{
  --dsh-claude-font-prose:var(--kat-font-prose);
  --dsh-claude-font-serif:var(--kat-font-prose);
}
${K}[data-kat-prose="mono"]{
  --kat-font-prose:var(--kat-font-mono);
  --dsh-claude-font-prose:var(--kat-font-mono);
  --dsh-claude-font-serif:var(--kat-font-mono);
}
body[data-kat-density="compact"]{--kat-prose-gap:12px;--kat-row-pad:6px}

${K} *,
${K} *::before,
${K} *::after{
  border-radius:var(--kat-radius) !important;
}
${K} *{scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l1,#1f1f1f) transparent}
${K} ::-webkit-scrollbar{width:10px;height:10px}
${K} ::-webkit-scrollbar-thumb{
  background:var(--dsw-alias-scrollbar-bg-l1,#1f1f1f);
  border-radius:var(--kat-radius) !important;
}
${K} ::-webkit-scrollbar-track{background:transparent}

${K} [class*=markdown],
${K} [class*=markdown] :where(p,li,blockquote,td,th,dd,dt){
  font-family:var(--kat-font-prose);
}
${K} [class*=markdown] :where(pre,code,kbd,samp){font-family:var(--kat-font-mono)}

${K} [class*=markdown] :where(p,ul,ol,blockquote){margin-block:calc(var(--kat-prose-gap) / 2)}
${K} [class*=markdown] :where(h1,h2,h3,h4){margin-block:var(--kat-prose-gap) calc(var(--kat-prose-gap) / 2)}
${K} [role="listitem"],
${K} [role="option"]{padding-block:var(--kat-row-pad)}

${K} :where(button,a,input,textarea,select,[role="button"],[role="option"],[role="tab"]){
  transition:background-color .15s ease,border-color .15s ease,color .15s ease,opacity .15s ease;
}

html:root body[data-kat-theme][data-kat-theme][data-kat-theme][data-kat-motion="calm"] [data-dsh-claude-context-meter]{
  animation:none !important;
}
html:root body[data-kat-theme][data-kat-theme][data-kat-theme][data-kat-motion="calm"] *,
html:root body[data-kat-theme][data-kat-theme][data-kat-theme][data-kat-motion="calm"] *::before,
html:root body[data-kat-theme][data-kat-theme][data-kat-theme][data-kat-motion="calm"] *::after{
  animation-iteration-count:1 !important;
  scroll-behavior:auto !important;
}

/* A spinner is information, not decoration: stopping it would report a
   running task as finished. These keep turning under calm and reduced motion. */
html:root body[data-kat-theme][data-kat-theme][data-kat-theme][data-kat-motion="calm"] [role="progressbar"],
html:root body[data-kat-theme][data-kat-theme][data-kat-theme][data-kat-motion="calm"] [role="progressbar"]::before,
html:root body[data-kat-theme][data-kat-theme][data-kat-theme][data-kat-motion="calm"] [role="progressbar"]::after,
html:root body[data-kat-theme][data-kat-theme][data-kat-theme][data-kat-motion="calm"] [aria-busy="true"],
html:root body[data-kat-theme][data-kat-theme][data-kat-theme][data-kat-motion="calm"] [aria-busy="true"]::before,
html:root body[data-kat-theme][data-kat-theme][data-kat-theme][data-kat-motion="calm"] [aria-busy="true"]::after,
html:root body[data-kat-theme][data-kat-theme][data-kat-theme][data-kat-motion="calm"] svg[data-state="ongoing"],
html:root body[data-kat-theme][data-kat-theme][data-kat-theme][data-kat-motion="calm"] svg[data-state="ongoing"]::before,
html:root body[data-kat-theme][data-kat-theme][data-kat-theme][data-kat-motion="calm"] svg[data-state="ongoing"]::after,
html:root body[data-kat-theme][data-kat-theme][data-kat-theme][data-kat-motion="calm"] [data-dsh-claude-caret-layer]{
  animation-iteration-count:infinite !important;
}

/* Working-session spinner: claude rotates a round ring; the square
   signature uses a smaller hollow square instead. */
@keyframes kat-square-spin{
  to{transform:rotate(1turn)}
}
${K} svg[data-state="ongoing"]{
  animation:kat-square-spin .85s linear infinite;
  box-sizing:border-box !important;
  width:8px !important;
  height:8px !important;
  border:1px solid var(--dsw-alias-label-primary,#f2f2f2) !important;
  background-color:transparent;
  border-radius:var(--kat-radius) !important;
}

/* The orb takes the spinner's exact spot: the host svg keeps its box and is
   only hidden, so rows do not reflow when the canvas lands on top of it. */
${K} .kat-orb{
  position:absolute;z-index:1;display:block;pointer-events:none;
}
${K} .kat-orb-host{position:relative}
${K} svg[data-kat-orb-hidden]{visibility:hidden !important}
${K} [data-dsh-boot-orb]{position:static !important;margin:0 auto;display:block}
${K} [data-dsh-boot-spinner][data-kat-orb-hidden]{display:none !important}

/* Boot screen: the shell paints a rounded card with a spinning ring. Square
   it off, drop the ring, and give it the same mono voice as the rest. */
${K} [data-dsh-boot]{
  background:var(--dsw-alias-bg-base,#0b0b0c) !important;
  font-family:var(--kat-font-mono) !important;
}
${K} [data-dsh-boot] [class*="wordmark"]{
  font-family:var(--kat-font-mono) !important;
  font-size:11px !important;
  font-weight:500 !important;
  letter-spacing:.34em !important;
  color:var(--dsw-alias-label-tertiary,#8a8a8a) !important;
}
${K} [data-dsh-boot] [class*="hint"]{
  font-family:var(--kat-font-mono) !important;
  font-size:11px !important;
  letter-spacing:.02em;
  color:var(--dsw-alias-label-dimmed,#6b6b6b) !important;
}

/* The composer mascot: claude-style paints a spritesheet whale above the
   prompt box and hangs a click bubble off the same host. The sprite is hidden
   and the orb drawn in its place; the host element and its hit area stay, so
   the bubble keeps working. */
${K} .dsh-claude-deepy-sprite{
  opacity:0 !important;
  visibility:hidden !important;
}
${K} [data-kat-orb-deepy]{
  position:absolute !important;
  inset:0;margin:auto;
  z-index:0;
}

/* Idle sessions render an empty leading slot that still reserves its width,
   which reads as a hole where the status light would be. Collapse it: the
   space appears only for a row that actually has an indicator. */
${K} [class*="slot"]:has(> [data-slot="sidebar.session.row.leading"]:empty){
  width:0 !important;
  min-width:0 !important;
  padding-left:0 !important;
  padding-right:0 !important;
  margin-left:0 !important;
  margin-right:0 !important;
  overflow:hidden !important;
}

/* Effort picker, list form: the host vertical radio menu becomes a
   horizontal segmented bar. The sliding pill is injected by the enhancer in
   apply(); with no JavaScript the checked option still carries the accent
   text colour, so the bar degrades rather than breaking. */
${K} [data-kat-effort-bar]{
  display:flex;flex-direction:row;align-items:stretch;gap:0;
  min-width:min(348px,calc(100vw - 16px));
}
${K} [data-kat-effort-bar] [role="menuitemradio"]{
  flex:1 1 0;min-width:0;position:relative;z-index:1;padding:8px 2px;text-align:center;
  font-size:12px;transition:color .18s ease;
}
${K} [data-kat-effort-bar] [role="menuitemradio"][aria-checked="true"]{
  color:var(--dsw-alias-label-primary,#f2f2f2);
}
${K} [data-kat-effort-bar] [role="menuitemradio"]:focus-visible{
  outline:2px solid var(--dsw-alias-brand-primary,#7dd3fc);
  outline-offset:-2px;
}
${K} .kat-effort-pill{
  position:absolute;left:0;top:0;z-index:0;pointer-events:none;
  background:var(--dsw-alias-interactive-bg-hover-accent,#7dd3fc29);
  border:1px solid var(--dsw-alias-brand-primary,#7dd3fc);
  transition:transform .28s cubic-bezier(.34,1.56,.64,1),width .28s cubic-bezier(.34,1.56,.64,1);
}

/* Effort picker, slider form (apex models): accent fill on a hairline
   track, LED ticks, and a knob that travels with an overshoot ease so it
   settles with a pop instead of gliding flat. */
${K} .dsh-claude-effort-track:before{
  background:var(--dsw-alias-bg-layer-1,#0a0a0a);
  border:1px solid var(--dsw-alias-border-l1,#1f1f1f);
}
${K} .dsh-claude-effort-fill{
  background:var(--dsw-alias-brand-primary,#7dd3fc);
  transition:width .22s cubic-bezier(.34,1.56,.64,1),opacity .18s ease;
}
${K} .dsh-claude-effort-knob{
  background:var(--dsw-alias-bg-layer-3,#131313);
  border:1px solid var(--dsw-alias-border-l3,#2a2a2a);
  box-shadow:0 1px 3px #0000008c;
  transition:translate .22s cubic-bezier(.34,1.56,.64,1),scale .12s ease,background-color .3s ease,box-shadow .3s ease;
}
${K} .dsh-claude-effort-tick{background:var(--dsw-alias-label-tertiary,#8a8a8a)}

@media (prefers-reduced-motion: reduce){
  html:root body[data-kat-theme] *,
  html:root body[data-kat-theme] *::before,
  html:root body[data-kat-theme] *::after{
    animation:none !important;
    transition-duration:.01ms !important;
    scroll-behavior:auto !important;
  }
  html:root body[data-kat-theme] [role="progressbar"],
  html:root body[data-kat-theme] [aria-busy="true"]{
    animation-duration:1.6s !important;
    animation-iteration-count:infinite !important;
  }
  html:root body[data-kat-theme] svg[data-state="ongoing"]{
    animation-name:kat-square-spin !important;
    animation-duration:1.6s !important;
    animation-iteration-count:infinite !important;
  }
}

/* The image-gen gallery chip duplicates the Image Studio surface and crowds
   the session header; the plugin keeps its tools and its other entry points. */
${K} button[title="Image Studio Gallery"]{
  display:none !important;
}

/* ---- Top bar: one ruled band, title row above, view tabs below ----
   The host header draws a 76px block with the title, chips and utility icons
   on one line and the tabs floating below it. Fixed heights and one hairline
   make it read as a single instrument strip: title row, then a tab rail on
   the band's baseline, all left-aligned. */
${K} header[data-window-drag]{
  background:var(--dsw-alias-bg-base,#000) !important;
  border-bottom:1px solid var(--dsw-alias-border-l1,#1f1f1f) !important;
  min-height:0 !important;
  padding:4px 14px 0 !important;
  grid-template-columns:auto minmax(0,1fr);
}
${K} header[data-window-drag] [class*="titleRow"]{
  min-height:32px !important;
  align-items:center !important;
  gap:12px !important;
  padding:0 !important;
}
${K} header[data-window-drag] [class*="titleCluster"]{
  flex:1 1 auto !important;
  align-items:center !important;
  gap:10px !important;
  min-width:0 !important;
  margin:0 !important;
  padding:0 !important;
}
${K} header[data-window-drag] [class*="crumbs"]{
  flex:0 1 auto !important;
  gap:6px !important;
  min-width:0 !important;
  color:var(--dsw-alias-label-tertiary,#8a8a8a) !important;
  font-family:var(--kat-font-mono) !important;
  font-size:12px !important;
  line-height:16px !important;
  letter-spacing:.01em !important;
}
${K} header[data-window-drag] [class*="crumb"]{
  max-width:min(52ch,42vw) !important;
  font-size:12px !important;
  line-height:16px !important;
  letter-spacing:.01em !important;
}
${K} header[data-window-drag] [class*="crumbCurrent"]{
  color:var(--dsw-alias-label-primary,#f2f2f2) !important;
  font-weight:600 !important;
}
${K} header[data-window-drag] [class*="headerActions"],
${K} header[data-window-drag] [class*="headerUtilities"]{
  flex:none !important;
  align-items:center !important;
  gap:6px !important;
  margin-left:0 !important;
}
${K} header[data-window-drag] [class*="headerUtilities"]{
  margin-left:auto !important;
}
${K} header[data-window-drag] :is([class*="headerActions"],[class*="headerUtilities"]) button{
  appearance:none;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:6px;
  height:26px !important;
  min-height:26px !important;
  min-width:26px;
  padding:0 8px !important;
  border:0 !important;
  background:transparent !important;
  color:var(--dsw-alias-label-secondary,#a3a3a3) !important;
  font-family:var(--kat-font-mono) !important;
  font-size:11.5px !important;
  line-height:1 !important;
  letter-spacing:.01em;
  transition:background-color .15s ease,color .15s ease;
}
${K} header[data-window-drag] :is([class*="headerActions"],[class*="headerUtilities"]) button:hover{
  background:var(--dsw-alias-interactive-bg-hover,#161616) !important;
  color:var(--dsw-alias-label-primary,#f2f2f2) !important;
}
${K} header[data-window-drag] [data-conversation-header-corner] button{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  height:26px !important;
  min-height:26px !important;
  min-width:26px;
  padding:0 !important;
  border:0 !important;
  background:transparent !important;
  color:var(--dsw-alias-label-secondary,#a3a3a3) !important;
  transition:background-color .15s ease,color .15s ease;
}
${K} header[data-window-drag] [data-conversation-header-corner] button:hover{
  background:var(--dsw-alias-interactive-bg-hover,#161616) !important;
  color:var(--dsw-alias-label-primary,#f2f2f2) !important;
}
${K} header[data-window-drag] [class*="_tabs"]{
  width:100% !important;
  min-height:32px !important;
  align-items:stretch !important;
  gap:0 !important;
  margin:0 !important;
  padding:0 !important;
}
${K} [data-conversation-tabs]{
  flex:1 1 auto !important;
  align-items:stretch !important;
  gap:0 !important;
  min-width:0 !important;
  min-height:32px !important;
}
${K} [data-conversation-tabs] > button{
  position:relative;
  height:32px !important;
  min-height:32px !important;
  margin:0 !important;
  padding:0 14px !important;
  border:0 !important;
  background:transparent !important;
  color:var(--dsw-alias-label-tertiary,#8a8a8a) !important;
  font-family:var(--kat-font-mono) !important;
  font-size:12.5px !important;
  font-weight:500 !important;
  line-height:1 !important;
  letter-spacing:.01em !important;
  white-space:nowrap;
  transition:color .15s ease,background-color .15s ease;
}
${K} [data-conversation-tabs] > button:hover{
  background:var(--dsw-alias-interactive-bg-hover,#141414) !important;
  color:var(--dsw-alias-label-primary,#f2f2f2) !important;
}
${K} [data-conversation-tabs] > button[aria-selected="true"]{
  color:var(--dsw-alias-label-primary,#f2f2f2) !important;
}
${K} [data-conversation-tabs] > button:after{
  left:0 !important;
  right:0 !important;
  bottom:0 !important;
  height:2px !important;
  border-radius:0 !important;
  background:transparent !important;
}
${K} [data-conversation-tabs] > button[aria-selected="true"]:after{
  background:var(--dsw-alias-brand-primary,#7dd3fc) !important;
}
${K} [data-conversation-tabs] > button:focus-visible{
  outline:2px solid var(--dsw-alias-brand-primary,#7dd3fc) !important;
  outline-offset:-2px;
}
`
    }

    const SWITCHES = [
      'data-kat-theme',
      'data-kat-motion',
      'data-kat-density',
      'data-kat-prose',
      'data-kat-accent',
      'data-kat-surface',
    ]

    const SETTINGS_CSS = `
${K} .kat-settings{display:flex;flex-direction:column;gap:18px;max-width:640px}
${K} .kat-settings-lede{margin:0;color:var(--dsw-alias-label-secondary,#a3a3a3);font-size:13px;line-height:20px}
${K} .kat-settings-group{display:flex;flex-direction:column;gap:8px;border-top:1px solid var(--dsw-alias-border-l1,#1f1f1f);padding-top:14px}
${K} .kat-settings-title{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary,#8a8a8a)}
${K} .kat-settings-row{display:flex;flex-wrap:wrap;gap:8px}
${K} .kat-settings-option{padding:7px 14px;background:var(--dsw-alias-bg-layer-2,#0e0e0e);color:var(--dsw-alias-label-secondary,#a3a3a3);border:1px solid var(--dsw-alias-border-l1,#1f1f1f);font:inherit;font-size:12px;cursor:pointer;transition:background-color .15s ease,border-color .15s ease,color .15s ease}
${K} .kat-settings-option:hover{background:var(--dsw-alias-interactive-bg-hover-solid,#181818);color:var(--dsw-alias-label-primary,#f2f2f2);border-color:var(--dsw-alias-border-l3,#2a2a2a)}
${K} .kat-settings-option[aria-pressed="true"]{background:var(--dsw-alias-brand-primary,#7dd3fc);color:var(--dsw-alias-brand-text,#04121a);border-color:var(--dsw-alias-brand-primary,#7dd3fc)}
${K} .kat-settings-option:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#7dd3fc);outline-offset:2px}
`

    function apply(ctx) {
      const store = typeof localStorage === 'undefined' ? null : localStorage
      const prefs = readPrefs(store)
      const body = document.body

      const paint = () => {
        body.setAttribute('data-kat-theme', '')
        body.setAttribute('data-kat-motion', prefs.motion)
        body.setAttribute('data-kat-density', prefs.density)
        body.setAttribute('data-kat-prose', prefs.prose)
        body.setAttribute('data-kat-accent', prefs.accent)
        body.setAttribute('data-kat-surface', prefs.surface)
      }
      paint()

      // buildTokens is pure per accent, and the re-assert path runs on every
      // host theme change; memoise so a scheme flip costs no rebuild.
      const tokenCache = new Map()
      const tokensFor = (accent, surface) => {
        const key = `${accent}|${surface}`
        if (!tokenCache.has(key)) tokenCache.set(key, buildTokens(accent, surface))
        return tokenCache.get(key)
      }

      let disposeLayer = ctx.theme.overrideTokens(SOURCE, tokensFor(prefs.accent, prefs.surface))

      // The host presenter owns the body's inline custom properties and
      // rewrites them wholesale from the snapshot it is handed. If our layer
      // ever drops out of that snapshot (a re-mount, a stale presenter pass)
      // the whole skin silently reverts to host paint, so re-assert instead of
      // assuming our first registration survives.
      const stackLayer = () => {
        disposeLayer()
        disposeLayer = ctx.theme.overrideTokens(SOURCE, tokensFor(prefs.accent, prefs.surface))
      }
      const snapshotKeepsLayer = (snapshot) => {
        const tokens = snapshot?.active?.tokens
        if (tokens === undefined) return false
        const scheme = snapshot.active.colorScheme === 'light' ? 'light' : 'dark'
        for (const [name, pair] of Object.entries(tokensFor(prefs.accent, prefs.surface))) {
          if (tokens[name] !== pair[scheme]) return false
        }
        return true
      }
      const offTheme = ctx.on('theme/change', (snapshot) => {
        if (snapshotKeepsLayer(snapshot)) return
        stackLayer()
      })

      // The stylesheet is owned here, not by a service: a static bundle has no
      // `styles` builtin, and reading an undeclared service throws.
      const sheet = document.createElement('style')
      sheet.textContent = stylesheet()
      document.head.appendChild(sheet)
      const disposeSheet = () => sheet.remove()

      // Effort picker, list form: a MutationObserver finds the host's effort
      // radio menu, marks it, and keeps a sliding pill under the checked
      // option. Presentational only: clicks and keyboard still run through
      // the native menuitems.
      //
      // The matcher is deliberately strict. The model list is a menu of
      // around a thousand menuitemradios whose names contain effort words
      // ("o3 Mini High"), so a substring check laid the model selector out as
      // a bar and broke it. A menu qualifies only when the permission
      // popover does not own it, every radio label matches an effort label
      // exactly, and the list is small. If a marked menu stops qualifying
      // (for example the host swaps in other content), the bar takes itself
      // off instead of staying on the wrong control.
      const EFFORT_LABEL = /^(default|low|medium|high)$/i
      const stopEffortBars = (() => {
        try {
          if (typeof MutationObserver === 'undefined') return () => {}
          if (!document || typeof document.querySelectorAll !== 'function' || !document.body) return () => {}

          const marked = new WeakSet()
          const qualifies = (menu, radios) =>
            radios.length > 0 &&
            radios.length <= 12 &&
            !(menu.closest && menu.closest('.dsh-claude-perm-popover')) &&
            radios.every((r) => EFFORT_LABEL.test((r.textContent || '').trim()))
          const unmark = (menu) => {
            marked.delete(menu)
            menu.removeAttribute('data-kat-effort-bar')
            const pill = menu.querySelector('.kat-effort-pill')
            if (pill) pill.remove()
          }
          const paint = (menu) => {
            if (!menu || menu.isConnected === false) return
            const radios = [...menu.querySelectorAll('[role="menuitemradio"]')]
            if (!qualifies(menu, radios)) {
              if (marked.has(menu)) unmark(menu)
              return
            }
            if (!marked.has(menu)) {
              marked.add(menu)
              menu.setAttribute('data-kat-effort-bar', '')
            }
            let pill = menu.querySelector('.kat-effort-pill')
            if (!pill) {
              pill = document.createElement('div')
              pill.className = 'kat-effort-pill'
              pill.setAttribute('aria-hidden', 'true')
              menu.appendChild(pill)
            }
            const active = radios.find((r) => r.getAttribute('aria-checked') === 'true')
            if (!active) {
              if (pill.style.opacity !== '0') pill.style.opacity = '0'
              return
            }
            const next = {
              transform: `translate(${active.offsetLeft}px, ${active.offsetTop}px)`,
              width: `${active.offsetWidth}px`,
              height: `${active.offsetHeight}px`,
              opacity: '1',
            }
            // Write only on change: the observer watches mutations, so an
            // unconditional write would retrigger itself forever.
            for (const [key, value] of Object.entries(next)) {
              if (pill.style[key] !== value) pill.style[key] = value
            }
          }
          const repaint = () => {
            for (const menu of document.querySelectorAll('[role="menu"]')) {
              try {
                paint(menu)
              } catch {
                /* one bad menu must not break the rest */
              }
            }
          }
          repaint()
          const observer = new MutationObserver(repaint)
          observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['aria-checked', 'class', 'style'],
          })
          return () => {
            observer.disconnect()
            for (const menu of document.querySelectorAll('[data-kat-effort-bar]')) {
              try {
                unmark(menu)
              } catch {
                /* already gone */
              }
            }
          }
        } catch {
          return () => {}
        }
      })()

      // Thinking orbs: the boot splash and every working-session row. The
      // host keeps its own spinner node (it owns the layout), so the canvas is
      // overlaid on that box rather than replacing it; teardown puts the host
      // element back exactly as it was.
      const stopOrbs = (() => {
        try {
          if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') {
            return () => {}
          }
          if (!document.body) return () => {}

          const live = []
          const done = new WeakSet()

          const mountBootOrb = () => {
            const boot = document.querySelector('[data-dsh-boot]')
            if (!boot) return
            const spinner = boot.querySelector('[data-dsh-boot-spinner]')
            if (!spinner || done.has(spinner) || spinner.parentElement === null) return
            const orb = createOrb(56, 'Loading the harness')
            if (!orb) return
            done.add(spinner)
            spinner.setAttribute('data-kat-orb-hidden', '')
            orb.element.setAttribute('data-dsh-boot-orb', '')
            spinner.parentElement.insertBefore(orb.element, spinner)
            live.push({ orb, host: null, spinner })
          }

          const mountRowOrb = (svg) => {
            if (done.has(svg)) return
            const host = svg.parentElement
            if (!host) return
            const box = svg.getBoundingClientRect ? svg.getBoundingClientRect() : null
            const width = Math.round((box && box.width) || 0) || 10
            const height = Math.round((box && box.height) || 0) || 10
            const size = Math.max(16, width)
            const orb = createOrb(size, 'Working')
            if (!orb) return
            done.add(svg)
            svg.setAttribute('data-kat-orb-hidden', '')
            if (host.classList) host.classList.add('kat-orb-host')
            const hostBox = host.getBoundingClientRect ? host.getBoundingClientRect() : null
            if (box && hostBox) {
              orb.element.style.left = `${box.left - hostBox.left - (size - width) / 2}px`
              orb.element.style.top = `${box.top - hostBox.top - (size - height) / 2}px`
            } else {
              orb.element.style.left = '0px'
              orb.element.style.top = '0px'
            }
            host.appendChild(orb.element)
            live.push({ orb, host, spinner: svg })
          }

          // A finished session drops its spinner while the row stays mounted:
          // an orb left behind would keep spinning on an idle session forever.
          const prune = () => {
            for (let i = live.length - 1; i >= 0; i--) {
              const entry = live[i]
              if (entry.spinner && entry.spinner.isConnected !== false) continue
              try {
                entry.orb.dispose()
                if (entry.host && entry.host.classList) entry.host.classList.remove('kat-orb-host')
              } catch {
                /* already gone */
              }
              live.splice(i, 1)
            }
          }

          const mountMascotOrb = () => {
            const deepy = document.querySelector('.dsh-claude-deepy')
            if (!deepy || done.has(deepy)) return
            const box = deepy.getBoundingClientRect ? deepy.getBoundingClientRect() : null
            const edge = Math.min((box && box.width) || 104, (box && box.height) || 104)
            const orb = createOrb(Math.max(40, Math.round(edge * 0.86)), 'Thinking orb', {
              playful: true,
            })
            if (!orb) return
            done.add(deepy)
            orb.element.setAttribute('data-kat-orb-deepy', '')
            deepy.appendChild(orb.element)
            live.push({ orb, host: null, spinner: deepy })
          }

          const scan = () => {
            try {
              prune()
              mountBootOrb()
              mountMascotOrb()
              for (const svg of document.querySelectorAll('svg[data-state="ongoing"]')) {
                mountRowOrb(svg)
              }
            } catch {
              /* one bad node must not stop the rest */
            }
          }
          scan()

          let observer = null
          if (typeof MutationObserver === 'function') {
            observer = new MutationObserver(scan)
            observer.observe(document.body, { childList: true, subtree: true })
          }

          return () => {
            if (observer) observer.disconnect()
            for (const entry of live) {
              try {
                entry.orb.dispose()
                if (entry.spinner) entry.spinner.removeAttribute('data-kat-orb-hidden')
                if (entry.host && entry.host.classList) entry.host.classList.remove('kat-orb-host')
              } catch {
                /* already gone */
              }
            }
            live.length = 0
          }
        } catch {
          return () => {}
        }
      })()

      // Always restack, even for the accent already in force: this is the one
      // public path a caller can use to heal a dropped layer by hand.
      const setAccent = (next) => {
        if (!ACCENTS[next]) return
        if (next !== prefs.accent) {
          prefs.accent = next
          writePrefs(store, prefs)
        }
        stackLayer()
        paint()
      }

      // Accent and substrate change the token layer itself; the rest are body
      // switches. Restacking on every setPref would churn the presenter.
      const PALETTE_KEYS = new Set(['accent', 'surface'])
      const setPref = (key, value) => {
        if (prefs[key] === value) return
        prefs[key] = value
        paint()
        if (PALETTE_KEYS.has(key)) stackLayer()
        writePrefs(store, prefs)
      }

      const reset = () => {
        Object.assign(prefs, DEFAULTS)
        stackLayer()
        paint()
        try {
          store.removeItem(PREF_KEY)
        } catch {
          /* nothing to forget */
        }
      }

      ctx.effect(
        () => () => {
          offTheme()
          stopEffortBars()
          stopOrbs()
          disposeLayer()
          disposeSheet()
          for (const name of SWITCHES) body.removeAttribute(name)
        },
        'custom-dsh-theme: palette, sheet and body switches',
      )

      globalThis.__KAT_THEME__ = { SOURCE, prefs, setAccent, setPref, reset, orbDots }

      ctx.slots.inject('settings.section', () =>
        ctx.slots.register(
          { name: 'settings.section', id: SOURCE, order: 23, label: () => 'Custom DSH Theme' },
          function CustomDshThemeSettings() {
            const [, force] = React.useState(0)
            const redraw = () => force((n) => n + 1)

            const group = (title, options, current, onPick) =>
              React.createElement(
                'div',
                { className: 'kat-settings-group' },
                React.createElement('div', { className: 'kat-settings-title' }, title),
                React.createElement(
                  'div',
                  { className: 'kat-settings-row', role: 'group', 'aria-label': title },
                  ...options.map(([value, text]) =>
                    React.createElement(
                      'button',
                      {
                        key: value,
                        type: 'button',
                        className: 'kat-settings-option',
                        'aria-pressed': String(current === value),
                        onClick: () => {
                          onPick(value)
                          redraw()
                        },
                      },
                      text,
                    ),
                  ),
                ),
              )

            return React.createElement(
              'div',
              { className: 'kat-settings' },
              React.createElement(
                'p',
                { className: 'kat-settings-lede' },
                'Personal square-minimal theme. Changes apply immediately.',
              ),
              group('Accent', [['sky', 'Sky'], ['emerald', 'Emerald'], ['mono', 'Mono']], prefs.accent, setAccent),
              group(
                'Black',
                [['amoled', 'Amoled'], ['soft', 'Soft'], ['warm', 'Warm']],
                prefs.surface,
                (v) => setPref('surface', v),
              ),
              group('Density', [['comfortable', 'Comfortable'], ['compact', 'Compact']], prefs.density, (v) => setPref('density', v)),
              group('Motion', [['calm', 'Calm'], ['full', 'Full']], prefs.motion, (v) => setPref('motion', v)),
              group('Prose', [['sans', 'Sans'], ['mono', 'Mono']], prefs.prose, (v) => setPref('prose', v)),
              React.createElement(
                'div',
                { className: 'kat-settings-group' },
                React.createElement(
                  'button',
                  {
                    type: 'button',
                    className: 'kat-settings-option',
                    onClick: () => {
                      reset()
                      redraw()
                    },
                  },
                  'Reset to defaults',
                ),
              ),
              React.createElement('style', null, SETTINGS_CSS),
            )
          },
        ),
      )
    }

    return { name: SOURCE, inject: ['theme', 'slots'], apply }
  },
})
