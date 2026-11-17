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
        // Eight-digit values are the same ramp colour carrying an alpha: remap
        // the colour and keep the suffix, or a warm substrate keeps black menus.
        const alpha = /^#([0-9a-f]{6})([0-9a-f]{2})$/i.exec(pair.dark)
        const stop = RAMP_KEYS[alpha ? `#${alpha[1]}`.toLowerCase() : pair.dark]
        out[name] = stop
          ? { dark: alpha ? `${stops[stop]}${alpha[2]}` : stops[stop], light: pair.light }
          : pair
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
        '--dsw-alias-label-caption': pair('#8a8a8a', '#6a6a68'),
        '--dsw-alias-label-dimmed': pair('#808080', '#6a6a68'),
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

    /**
     * The working state: three rings, each tilted on its own axis and turning
     * at its own speed, so the figure reads as a mechanism doing something
     * rather than a ball of dots. This is what a running session shows; the
     * plain sphere reads as ornament.
     */
    const ORB_ORBITS = [
      { count: 8, radius: 0.86, tiltX: 0.42, tiltZ: 0.2, speed: 1.05 },
      { count: 7, radius: 0.72, tiltX: -0.62, tiltZ: 1.05, speed: -0.82 },
      { count: 6, radius: 0.58, tiltX: 1.15, tiltZ: -0.4, speed: 1.3 },
    ]

    function orbWorkingDots(t, size) {
      const c = size / 2
      const weight = size <= 24 ? 0.085 : 0.02
      const dots = []
      for (let oi = 0; oi < ORB_ORBITS.length; oi++) {
        const orbit = ORB_ORBITS[oi]
        // At row size the full particle count merges into a blob: keep each
        // ring sparse enough that its tilt is still legible.
        const count = size <= 24 ? Math.max(4, Math.round(orbit.count * 0.6)) : orbit.count
        const spin = t * orbit.speed
        const cz = Math.cos(orbit.tiltZ)
        const sz = Math.sin(orbit.tiltZ)
        const cx = Math.cos(orbit.tiltX)
        const sx = Math.sin(orbit.tiltX)
        for (let i = 0; i < count; i++) {
          const angle = spin + (i * Math.PI * 2) / count
          const x0 = Math.cos(angle) * orbit.radius
          const z0 = Math.sin(angle) * orbit.radius
          // tilt about Z, then about X, so the three rings cross each other
          const x1 = x0 * cz - 0 * sz
          const y1 = x0 * sz + 0 * cz
          const y2 = y1 * cx - z0 * sx
          const z2 = y1 * sx + z0 * cx
          const depth = (z2 + 1) / 2
          dots.push({
            x: c + x1 * c,
            y: c - y2 * c,
            r: Math.max(0.4, size * weight * (0.55 + depth * 0.9)),
            a: 0.16 + depth * 0.84,
            orbit: oi,
          })
        }
      }
      return dots
    }

    /** Typing/streaming: a rolling waveform, the shape of something arriving. */
    function orbWaveDots(t, size) {
      const columns = size <= 24 ? 7 : 13
      const mid = size / 2
      const amp = size * 0.17
      const span = size * 0.66
      const weight = size <= 24 ? 0.05 : 0.02
      const dots = []
      for (let i = 0; i < columns; i++) {
        const x = size * 0.17 + ((i + 0.5) * span) / columns
        const phase = (i / columns) * Math.PI * 2
        const lift = Math.sin(t * 3.1 + phase) * Math.sin(t * 1.1 + phase * 0.5)
        const depth = 0.5 + 0.5 * Math.sin(t * 3.1 + phase)
        dots.push({
          x,
          y: mid + lift * amp,
          r: Math.max(0.4, size * weight * (0.6 + depth * 0.8)),
          a: 0.25 + depth * 0.75,
        })
      }
      return dots
    }

    /** Searching: the same sphere, lit by a meridian that sweeps across it. */
    function orbScanDots(t, size) {
      const preset = size <= 24 ? ORB_PRESETS.sm : ORB_PRESETS.lg
      const n = preset.dots
      const c = size / 2
      const radius = c * ORB_SCALE
      const turn = t * 0.35
      const sweep = (t * 1.15) % (Math.PI * 2)
      const ct = Math.cos(preset.tilt)
      const st = Math.sin(preset.tilt)
      const dots = []
      for (let i = 0; i < n; i++) {
        const y = 1 - (2 * (i + 0.5)) / n
        const ring = Math.sqrt(Math.max(0, 1 - y * y))
        const phi = i * Math.PI * (3 - Math.sqrt(5))
        const x0 = Math.cos(phi + turn) * ring
        const z0 = Math.sin(phi + turn) * ring
        const y1 = y * ct - z0 * st
        const z2 = y * st + z0 * ct
        const depth = (z2 + 1) / 2
        // Distance from the sweep line drives the brightness: one travelling
        // meridian lights the globe, everything else stays dim.
        const delta = Math.abs(((Math.atan2(z2, x0) - sweep + Math.PI * 3) % (Math.PI * 2)) - Math.PI)
        const lit = Math.max(0, 1 - delta / 0.9)
        dots.push({
          x: c + x0 * radius,
          y: c - y1 * radius,
          r: Math.max(0.4, size * preset.weight * (0.55 + depth * 0.9) * (1 + lit * 0.5)),
          a: Math.min(1, 0.14 + depth * 0.4 + lit * 0.75),
        })
      }
      return dots
    }

    /** Fetching: particles stream along lanes, left to right. */
    function orbFetchDots(t, size) {
      const c = size / 2
      const weight = size <= 24 ? 0.05 : 0.019
      const lanes = 3
      const count = size <= 24 ? 4 : 7
      const dots = []
      for (let lane = 0; lane < lanes; lane++) {
        const y0 = c + (lane - (lanes - 1) / 2) * size * 0.16
        for (let i = 0; i < count; i++) {
          const phase = (i / count + t * 0.35 + lane * 0.13) % 1
          const depth = 0.35 + 0.65 * Math.sin(phase * Math.PI)
          dots.push({
            x: size * 0.12 + phase * size * 0.76,
            y: y0 + Math.sin(phase * Math.PI * 2) * size * 0.03,
            r: Math.max(0.4, size * weight * (0.6 + depth * 0.8)),
            a: 0.2 + depth * 0.8,
          })
        }
      }
      return dots
    }

    /** Reading: a lit band sweeps down a dotted page. */
    function orbReadDots(t, size) {
      const weight = size <= 24 ? 0.045 : 0.017
      const cols = size <= 24 ? 4 : 7
      const rows = size <= 24 ? 4 : 8
      const sweep = (t * 0.5) % 1
      const dots = []
      for (let row = 0; row < rows; row++) {
        const ry = size * 0.14 + ((row + 0.5) * size * 0.72) / rows
        const lit = Math.max(0, 1 - Math.abs((row + 0.5) / rows - sweep) * 4)
        for (let col = 0; col < cols; col++) {
          dots.push({
            x: size * 0.2 + ((col + 0.5) * size * 0.6) / cols,
            y: ry + Math.sin(t * 2 + row * 1.7 + col) * size * 0.008,
            r: Math.max(0.4, size * weight * (0.7 + lit * 0.7)),
            a: 0.18 + lit * 0.82,
          })
        }
      }
      return dots
    }

    /** Reasoning: two counter-rotating rings, tighter than the working state. */
    function orbReasoningDots(t, size) {
      const c = size / 2
      const weight = size <= 24 ? 0.055 : 0.019
      const rings = [
        { count: size <= 24 ? 5 : 8, radius: 0.66, tilt: 0.55, dir: 1 },
        { count: size <= 24 ? 5 : 8, radius: 0.44, tilt: -0.75, dir: -1 },
      ]
      const dots = []
      for (let ri = 0; ri < rings.length; ri++) {
        const ring = rings[ri]
        const spin = t * 1.1 * ring.dir
        const cx = Math.cos(ring.tilt)
        const sx = Math.sin(ring.tilt)
        for (let i = 0; i < ring.count; i++) {
          const angle = spin + (i * Math.PI * 2) / ring.count
          const x0 = Math.cos(angle) * ring.radius
          const z0 = Math.sin(angle) * ring.radius
          const y1 = x0 * sx
          const z1 = z0
          const depth = (z1 + 1) / 2
          dots.push({
            x: c + x0 * c,
            y: c - y1 * c,
            r: Math.max(0.4, size * weight * (0.6 + depth * 0.8)),
            a: 0.2 + depth * 0.8,
            ring: ri,
          })
        }
      }
      return dots
    }

    function orbDots(t, size, options) {
      const playful = options !== undefined && options.playful === true
      const requested =
        options !== undefined && typeof options.state === 'string' ? options.state : 'sphere'
      const state = ['working', 'wave', 'scan', 'done', 'warning', 'fetch', 'reading', 'reasoning', 'waiting'].includes(requested)
        ? requested
        : 'sphere'
      // Done keeps a slow drift so it reads as alive, not stuck; waiting is
      // slower still.
      const tt = state === 'done' ? t * 0.5 : state === 'waiting' ? t * 0.18 : t
      // A 12px sphere turning slowly moves less than a pixel per second, which
      // reads as frozen. Done and warning carry a second, visible channel:
      // brightness breathing, and for done a little scale.
      const pulse =
        state === 'warning'
          ? 0.55 + 0.45 * Math.sin(t * 2.6)
          : state === 'done'
            ? 0.75 + 0.25 * Math.sin(t * 1.35)
            : 1
      const kick = options !== undefined && typeof options.kick === 'number'
        ? Math.max(0, Math.min(1, options.kick))
        : 0
      const preset = size <= 24 ? ORB_PRESETS.sm : ORB_PRESETS.lg
      const n = preset.dots
      const c = size / 2
      const radius = c * ORB_SCALE
      const turn = tt * preset.speed
      const ca = Math.cos(turn)
      const sa = Math.sin(turn)
      const ct = Math.cos(preset.tilt)
      const st = Math.sin(preset.tilt)
      const dots = []
      if (state === 'working') dots.push(...orbWorkingDots(tt, size))
      if (state === 'wave') dots.push(...orbWaveDots(tt, size))
      if (state === 'scan') dots.push(...orbScanDots(tt, size))
      if (state === 'fetch') dots.push(...orbFetchDots(tt, size))
      if (state === 'reading') dots.push(...orbReadDots(tt, size))
      if (state === 'reasoning') dots.push(...orbReasoningDots(tt, size))
      // The status states are sphere geometry: done settles, warning pulses.
      const usesSphere =
        state === 'sphere' || state === 'done' || state === 'warning' || state === 'waiting'
      for (let i = 0; usesSphere && i < n; i++) {
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
      // A poke shoves every particle outward from the centre; it springs back
      // as the kick decays, so the click literally moves the orbs.
      if (kick > 0) {
        for (const dot of dots) {
          dot.x += (dot.x - c) * kick * 0.45
          dot.y += (dot.y - c) * kick * 0.45
          dot.a = Math.min(1, dot.a * (1 - kick * 0.2))
        }
      }
      return {
        size,
        state,
        kick,
        dots,
        pulse,
        bob: playful ? Math.sin(tt * 1.7) * size * 0.022 : 0,
        breathe: playful
          ? 1 + Math.sin(tt * 1.15) * 0.034
          : state === 'waiting'
            ? 1 + Math.sin(t * 0.9) * 0.05
            : state === 'done'
              ? 1 + Math.sin(t * 0.9) * 0.12
              : 1,
        sparks: playful ? orbSparks(t, size) : [],
      }
    }

    function orbInk(override) {
      if (typeof override === 'string' && override.length > 0) return override
      return tokenInk('--dsw-alias-label-primary', '#f2f2f2')
    }

    function tokenInk(name, fallback) {
      try {
        const value = getComputedStyle(document.body).getPropertyValue(name)
        if (value && value.trim()) return value.trim()
      } catch {
        /* computed style unavailable: use the literal */
      }
      return fallback
    }

    function orbInkUnused() {
      try {
        const value = getComputedStyle(document.body).getPropertyValue('--dsw-alias-label-primary')
        if (value && value.trim()) return value.trim()
      } catch {
        /* computed style unavailable: fall through to a literal */
      }
      return '#f2f2f2'
    }

    /** Returns { element, dispose } or null when the platform cannot draw. */
    const ORB_STATE_LABELS = {
      sphere: 'Idle',
      working: 'Working',
      wave: 'Writing',
      scan: 'Searching',
      fetch: 'Fetching',
      reading: 'Reading',
      reasoning: 'Reasoning',
      waiting: 'Waiting',
      done: 'Finished',
      warning: 'Needs attention',
    }

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

        let state = options !== undefined && typeof options.state === 'string' ? options.state : 'sphere'
        let pokeAt = -1
        const clock = () =>
          typeof performance === 'object' && performance !== null && typeof performance.now === 'function'
            ? performance.now()
            : Date.now()
        const POKE_MS = 1400

        const draw = (t) => {
          // The poke shoves the particles outward and lets them spring back.
          const ageMs = pokeAt >= 0 ? clock() - pokeAt : -1
          const kick =
            ageMs >= 0 && ageMs < 700 ? Math.sin((Math.PI * ageMs) / 700) : 0
          const frame = orbDots(t, size, { ...options, state, kick })
          ctx2d.clearRect(0, 0, size, size)
          ctx2d.fillStyle = orbInk(options && options.ink)
          const c = size / 2
          ctx2d.save()
          // Bob and breathe around the orb's own centre, never the canvas corner.
          ctx2d.translate(c, c + frame.bob)
          ctx2d.scale(frame.breathe, frame.breathe)
          ctx2d.translate(-c, -c)
          for (const dot of frame.dots) {
            ctx2d.globalAlpha = Math.min(1, dot.a * (frame.pulse === undefined ? 1 : frame.pulse))
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
          // A poke throws a ring of sparks out of the orb and fades it.
          if (pokeAt >= 0) {
            const age = (clock() - pokeAt) / 1000
            if (age >= 0 && age < POKE_MS / 1000) {
              for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2
                const radius = size * (0.14 + age * 0.62)
                ctx2d.globalAlpha = Math.max(0, 1 - age / (POKE_MS / 1000)) * 0.85
                ctx2d.beginPath()
                ctx2d.arc(c + Math.cos(angle) * radius, c + Math.sin(angle) * radius, Math.max(0.6, size * 0.019), 0, Math.PI * 2)
                ctx2d.fill()
              }
            } else if (age >= POKE_MS / 1000) {
              pokeAt = -1
            }
          }
          ctx2d.restore()
          ctx2d.globalAlpha = 1
        }

        const still =
          typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
        if (still || typeof requestAnimationFrame !== 'function') {
          draw(0.65)
          return {
            element: canvas,
            setState() {},
            poke() {},
            dispose() {},
          }
        }

        let frame = 0
        let startedAt = 0
        let lastTime = 0
        let lastDrawAt = 0
        let visible = true
        const step = (now) => {
          if (!visible) return
          if (!startedAt) startedAt = now
          lastTime = (now - startedAt) / 1000
          // Decorative canvas: 30fps still reads as a smooth breath and halves
          // the per-frame draw work on integrated graphics.
          if (now - lastDrawAt >= orbFrameMs) {
            lastDrawAt = now
            draw(lastTime)
          }
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

        const applyState = () => {
          canvas.setAttribute('data-kat-orb-state', state)
          canvas.title = ORB_STATE_LABELS[state] || state
          if (canvas.setAttribute) canvas.setAttribute('aria-label', ORB_STATE_LABELS[state] || label || 'Working')
        }
        applyState()

        return {
          element: canvas,
          setState(next) {
            if (typeof next !== 'string' || next === state) return
            state = next
            applyState()
          },
          poke() {
            pokeAt = clock()
            const pokes = Number(canvas.getAttribute('data-kat-orb-pokes') || 0) + 1
            canvas.setAttribute('data-kat-orb-pokes', String(pokes))
            // A paused orb still owes the tap a frame.
            if (typeof requestAnimationFrame === 'function') {
              requestAnimationFrame(() => {
                frame = requestAnimationFrame(step)
              })
            }
          },
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

    /**
     * The phone page: dsh-mobile's dedicated frontend says so outright; any
     * other touch-only browser (coarse pointer, no hover) is treated the same.
     */
    function isMobilePage(view, matches) {
      if (view && view.__DSH_MOBILE_FRONTEND__ === 'dedicated') return true
      return matches('(pointer: coarse)') && !matches('(hover: hover)')
    }
    // Desktop draws the orb at ~33fps; a phone at ~12fps, which still reads as
    // motion and costs a third of the canvas work on a weak GPU.
    const ORB_FRAME_MS = 30
    const MOBILE_ORB_FRAME_MS = 80
    let orbFrameMs = ORB_FRAME_MS

    // The transcript tags every tool call with data-tool. While one is in
    // flight, that name is the most specific thing the orb can say.
    const TOOL_STATES = [
      [/search/, 'scan'],
      [/fetch|http|web/, 'fetch'],
      [/bash|shell|exec|terminal|command/, 'working'],
      [/read|write|edit|grep|glob|list|file|patch/, 'reading'],
      [/image|generate|video/, 'reasoning'],
    ]
    function toolState(name) {
      for (const [pattern, state] of TOOL_STATES) if (pattern.test(name)) return state
      return 'working'
    }

    /**
     * What the model in the open session is doing, read from the host
     * transcript alone. The chat column carries [data-chat-running] only while
     * a turn is live; without it the orb rests, whatever else is on the page.
     * Inside a live turn: a running tool names the work; an answer being
     * written is the wave. Anything else is the model thinking: the host does
     * not render a reasoning block until it closes, so the gap after a finished
     * tool call is the reasoning state, not generic work.
     */
    function readActivity(root) {
      if (!root.querySelector('[data-chat-running]')) return 'waiting'
      const tool = root.querySelector('[data-tool][data-state="running"],[data-tool][data-state="pending"]')
      if (tool) return toolState((tool.getAttribute('data-tool') || '').toLowerCase())
      const flow = root.querySelectorAll('[data-chat-flow-kind]')
      const last = flow.length ? flow[flow.length - 1] : null
      if (
        last &&
        last.getAttribute('data-chat-flow-kind') === 'assistant-step' &&
        last.getAttribute('data-chat-group-part') === 'response'
      ) {
        return 'wave'
      }
      return 'reasoning'
    }

    /* ---- Effort slider -------------------------------------------------
     * Forked from claude-style's effort slider, without its model picker. The
     * host opens effort as a submenu of menuitemradio rows; the slider is laid
     * over that same menu and every pick clicks the host radio, so the host
     * keeps owning the value and the plain list still works with JS off.
     */
    const EFFORT_LABEL = /^(default|off|minimal|low|medium|high|xhigh|max)$/i
    const effort = {
      isEffortList(labels) {
        return labels.length > 0 && labels.length <= 12 && labels.every((l) => EFFORT_LABEL.test(String(l).trim()))
      },
      fractionOf(index, count) {
        return count > 1 ? index / (count - 1) : 0
      },
      indexAt(fraction, count) {
        if (count <= 1) return 0
        const f = Math.min(1, Math.max(0, fraction))
        return Math.round(f * (count - 1))
      },
    }

    function el(tag, className, text) {
      const node = document.createElement(tag)
      if (className) node.className = className
      if (text !== undefined) node.textContent = text
      return node
    }

    function buildEffortSlider(menu, radios) {
      const labels = radios.map((r) => (r.textContent || '').trim())
      const root = el('div', 'kat-effort')
      root.setAttribute('data-kat-effort', '')
      const head = el('div', 'kat-effort-head')
      const title = el('span', 'kat-effort-title', 'Effort')
      const value = el('span', 'kat-effort-value')
      head.append(title, value)
      const track = el('div', 'kat-effort-track')
      track.setAttribute('role', 'slider')
      track.setAttribute('tabindex', '0')
      track.setAttribute('aria-label', 'Reasoning effort')
      track.setAttribute('aria-valuemin', '0')
      track.setAttribute('aria-valuemax', String(labels.length - 1))
      const fill = el('div', 'kat-effort-fill')
      const knob = el('div', 'kat-effort-knob')
      const ticks = el('div', 'kat-effort-ticks')
      for (let i = 0; i < labels.length; i++) {
        const tick = el('span', 'kat-effort-tick')
        tick.style.left = `${effort.fractionOf(i, labels.length) * 100}%`
        ticks.appendChild(tick)
      }
      track.append(fill, ticks, knob)
      const ends = el('div', 'kat-effort-ends')
      ends.append(el('span', '', 'Faster'), el('span', '', 'Smarter'))
      root.append(head, track, ends)

      let index = Math.max(0, radios.findIndex((r) => r.getAttribute('aria-checked') === 'true'))
      // Position is a percentage of the track, so nothing is measured while
      // idle and a resize needs no relayout pass of ours.
      const show = (i) => {
        const pct = `${effort.fractionOf(i, labels.length) * 100}%`
        knob.style.left = pct
        fill.style.width = pct
        value.textContent = labels[i] || ''
        track.setAttribute('aria-valuenow', String(i))
        track.setAttribute('aria-valuetext', labels[i] || '')
      }
      show(index)

      // A pick clicks the host's own menuitemradio: the host updates the session,
      // closes the menu and re-renders, exactly as a click on the list would.
      const pick = (i) => {
        if (i === index) return
        index = i
        show(i)
        const radio = radios[i]
        if (radio && radio.isConnected) radio.click()
      }

      let dragging = false
      const fractionFrom = (event) => {
        const box = track.getBoundingClientRect()
        return box.width ? (event.clientX - box.left) / box.width : 0
      }
      track.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return
        event.preventDefault()
        event.stopPropagation()
        dragging = true
        root.setAttribute('data-dragging', '')
        track.setPointerCapture(event.pointerId)
        show(effort.indexAt(fractionFrom(event), labels.length))
      })
      track.addEventListener('pointermove', (event) => {
        if (dragging) show(effort.indexAt(fractionFrom(event), labels.length))
      })
      const finish = (event) => {
        if (!dragging) return
        dragging = false
        root.removeAttribute('data-dragging')
        pick(effort.indexAt(fractionFrom(event), labels.length))
      }
      track.addEventListener('pointerup', finish)
      track.addEventListener('pointercancel', () => {
        dragging = false
        root.removeAttribute('data-dragging')
        show(index)
      })
      track.addEventListener('keydown', (event) => {
        const last = labels.length - 1
        const next =
          event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? Math.max(0, index - 1)
            : event.key === 'ArrowRight' || event.key === 'ArrowUp' ? Math.min(last, index + 1)
              : event.key === 'Home' ? 0
                : event.key === 'End' ? last
                  : -1
        if (next < 0) return
        event.preventDefault()
        event.stopPropagation()
        pick(next)
      })
      // Menus close on outside pointerdown; the slider is inside the menu but
      // its events must not reach the host's item-activation handlers.
      root.addEventListener('click', (event) => event.stopPropagation())

      menu.setAttribute('data-kat-effort-menu', '')
      menu.insertBefore(root, menu.firstChild)
      return root
    }

    /** Effort menus are small: every radio an effort label, at most 12. */
    function enhanceEffortMenus(scope) {
      for (const menu of scope.querySelectorAll('[role="menu"]')) {
        const radios = [...menu.querySelectorAll('[role="menuitemradio"]')]
        const isEffort = effort.isEffortList(radios.map((r) => r.textContent || ''))
        const slider = menu.querySelector(':scope > [data-kat-effort]')
        // A reused menu node may now hold the model list: take the slider off.
        if (!isEffort) {
          if (slider) slider.remove()
          menu.removeAttribute('data-kat-effort-menu')
          continue
        }
        // Rows re-rendered under a standing slider: rebuild against the new nodes.
        if (slider && slider.__katRadios && slider.__katRadios.every((r) => r.isConnected)) continue
        if (slider) slider.remove()
        buildEffortSlider(menu, radios).__katRadios = radios
      }
    }

    /* ---- Message actions ------------------------------------------------
     * Forked from claude-style: retract / edit on your own message, rerun /
     * delete under an answer. Each forks the session just before the message
     * through the host sessions service and puts text back in the composer;
     * the original session is never rewritten.
     */
    const ACTION_ICONS = {
      retract: 'M4.5 6.5H10a4 4 0 0 1 0 8H7M4.5 6.5 7 4M4.5 6.5 7 9',
      edit: 'M10.8 2.7 13.3 5.2 5.8 12.7 2.9 13.4 3.6 10.5ZM9.6 3.9 12.1 6.4',
      rerun: 'M13.5 5.5V2.8m0 2.7h-2.7M13.2 5.2a5.5 5.5 0 1 0 1 5.2',
      delete: 'M4 4l8 8M12 4l-8 8',
    }
    const ACTION_LABELS = {
      retract: 'Retract this message',
      edit: 'Edit this message',
      rerun: 'Run this turn again',
      delete: 'Delete this turn',
    }

    function actionButton(kind) {
      const button = el('button', 'kat-action')
      button.type = 'button'
      button.setAttribute('data-kat-action', kind)
      button.setAttribute('aria-label', ACTION_LABELS[kind])
      button.title = ACTION_LABELS[kind]
      const ns = 'http://www.w3.org/2000/svg'
      const svg = document.createElementNS(ns, 'svg')
      svg.setAttribute('viewBox', '0 0 16 16')
      svg.setAttribute('width', '15')
      svg.setAttribute('height', '15')
      svg.setAttribute('aria-hidden', 'true')
      const path = document.createElementNS(ns, 'path')
      path.setAttribute('d', ACTION_ICONS[kind])
      path.setAttribute('fill', 'none')
      path.setAttribute('stroke', 'currentColor')
      path.setAttribute('stroke-width', '1.5')
      path.setAttribute('stroke-linecap', 'round')
      path.setAttribute('stroke-linejoin', 'round')
      svg.appendChild(path)
      button.appendChild(svg)
      return button
    }

    function createMessageActions(ctx) {
      const get = (name) => {
        try {
          return ctx.get ? ctx.get(name) : undefined
        } catch {
          return undefined
        }
      }
      const sessionKey = () => get('uiSession')?.current?.value?.key ?? null

      // The user row carries the message seq on its chat node; reading it from
      // the chat target snapshot is the only way to fork at the right event.
      const messageOf = (userRow) => {
        const id = sessionKey()
        if (id === null) return null
        const target = get('uiConversation')?.binding?.(id)?.target?.('chat')
        const snapshot = target?.getSnapshot?.()
        const key = userRow.getAttribute('data-chat-node-key')
        if (!snapshot || key === null) return null
        let node = null
        for (const candidate of snapshot.nodes?.values?.() ?? []) {
          if (candidate.key === key) {
            node = candidate
            break
          }
        }
        const seq = node?.data?.seq
        if (!Number.isSafeInteger(seq)) return null
        const content = Array.isArray(node.data.content) ? node.data.content : []
        const text = content.filter((p) => p && p.type === 'text').map((p) => p.text).join('')
        const turn = Number(userRow.getAttribute('data-chat-turn'))
        const live = snapshot.timeline?.turns?.get?.(turn)
        return { sessionId: id, seq, text, attachments: content.some((p) => p && p.type !== 'text'), open: !!live && live.end === undefined }
      }

      const userRowForTurn = (row) => {
        const turn = row.getAttribute('data-chat-turn')
        return turn === null
          ? null
          : document.querySelector(`[data-chat-flow-kind="user"][data-chat-turn="${CSS.escape(turn)}"]`)
      }

      let busy = false
      const forkAt = async (message, draft, submit) => {
        const sessions = get('sessions')
        const workspace = get('uiWorkspace')
        if (typeof sessions?.fork !== 'function' || typeof workspace?.openSession !== 'function') {
          throw new Error('custom-dsh-theme: the host offers no session fork')
        }
        const forked = await sessions.fork({ sessionId: message.sessionId, atSeq: message.seq - 1, increaseTitle: true })
        workspace.openSession(forked)
        // The forked session binds its composer a moment after it opens.
        const deadline = Date.now() + 4000
        for (;;) {
          const binding = sessions.binding?.(forked)
          const input = binding ? get('conversation')?.input?.for?.(binding.ctx) : null
          if (input) {
            input.setDraft(draft)
            if (submit) input.actions?.submit?.()
            else input.focus?.()
            return
          }
          if (Date.now() > deadline) throw new Error('custom-dsh-theme: the forked session never bound its composer')
          await new Promise((r) => setTimeout(r, 60))
        }
      }
      const run = (job) => {
        if (busy) return
        busy = true
        Promise.resolve()
          .then(job)
          .catch((error) => console.error('[custom-dsh-theme] message action failed:', error))
          .finally(() => {
            busy = false
          })
      }

      const handlers = {
        retract: (msg) => forkAt(msg, msg.text, false),
        edit: (msg, userRow) => openEditor(msg, userRow),
        rerun: (msg) => forkAt(msg, msg.text, true),
        delete: (msg) => forkAt(msg, '', false),
      }

      // Inline editor under the message: Enter sends into a fork, Escape or
      // Cancel closes it. Never a blocking dialog, which phones render badly.
      let editor = null
      const closeEditor = () => {
        if (editor) editor.remove()
        editor = null
      }
      const openEditor = (msg, userRow) => {
        closeEditor()
        const box = el('div', 'kat-editor')
        const input = el('textarea', 'kat-editor-input')
        input.value = msg.text
        input.rows = Math.min(10, Math.max(2, msg.text.split('\n').length))
        input.setAttribute('aria-label', ACTION_LABELS.edit)
        const row = el('div', 'kat-editor-row')
        const cancel = el('button', 'kat-editor-cancel', 'Cancel')
        cancel.type = 'button'
        const save = el('button', 'kat-editor-save', 'Save and send')
        save.type = 'button'
        row.append(cancel, save)
        box.append(input, row)
        const send = () => {
          const text = input.value
          if (text.trim() === '') return
          closeEditor()
          run(() => forkAt(msg, text, true))
        }
        input.addEventListener('input', () => {
          save.disabled = input.value.trim() === ''
        })
        input.addEventListener('keydown', (event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            closeEditor()
          } else if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            send()
          }
        })
        cancel.addEventListener('click', (event) => {
          event.stopPropagation()
          closeEditor()
        })
        save.addEventListener('click', (event) => {
          event.stopPropagation()
          send()
        })
        userRow.appendChild(box)
        editor = box
        input.focus()
        input.setSelectionRange(input.value.length, input.value.length)
        return undefined
      }

      const onClick = (event) => {
        const button = event.target.closest?.('[data-kat-action]')
        if (!button) return
        event.stopPropagation()
        const row = button.closest('[data-chat-flow-kind]')
        const userRow = row && row.getAttribute('data-chat-flow-kind') === 'user' ? row : row && userRowForTurn(row)
        const message = userRow ? messageOf(userRow) : null
        if (!message || message.seq <= 0 || message.open) return
        const kind = button.getAttribute('data-kat-action')
        if (kind === 'edit') handlers.edit(message, userRow)
        else run(() => handlers[kind](message))
      }
      document.addEventListener('click', onClick, true)

      // Action rows mount and unmount with paging; each gets its buttons once.
      const decorate = (scope) => {
        for (const bar of scope.querySelectorAll('[data-chat-flow-kind="user"] [class*="_actions"]:not([data-kat-actions])')) {
          bar.setAttribute('data-kat-actions', '')
          bar.append(actionButton('retract'), actionButton('edit'))
        }
        for (const bar of scope.querySelectorAll('[data-turn-tail] [class*="_actions"]:not([data-kat-actions])')) {
          bar.setAttribute('data-kat-actions', '')
          bar.append(actionButton('rerun'), actionButton('delete'))
        }
      }
      return {
        decorate,
        dispose() {
          document.removeEventListener('click', onClick, true)
          closeEditor()
          for (const node of document.querySelectorAll('[data-kat-action]')) node.remove()
          for (const node of document.querySelectorAll('[data-kat-actions]')) node.removeAttribute('data-kat-actions')
        },
      }
    }

    /* ---- Permission menu: mark the active preset ------------------------ */
    function markPermissionMenus(scope) {
      const trigger = document.querySelector('button[aria-label^="Access mode, current:"]')
      if (!trigger) return
      const current = trigger.getAttribute('aria-label').replace(/^Access mode, current:\s*/, '').trim().toLowerCase()
      for (const menu of scope.querySelectorAll('[role="menu"]')) {
        const items = [...menu.querySelectorAll('[role="menuitem"]')]
        const names = items.map((i) => (i.textContent || '').trim().toLowerCase())
        if (!names.includes('read only') || !names.some((n) => n === 'full access')) continue
        menu.setAttribute('data-kat-perm', '')
        items.forEach((item, i) => item.toggleAttribute('data-kat-current', names[i] === current))
      }
    }

    /**
     * One observer for every forked feature. Mutations only queue work; the
     * work runs once per batch on a short timer (frames stop in a hidden tab,
     * and menus must still be enhanced the moment they open).
     */
    function installFeatures(ctx) {
      if (typeof document === 'undefined' || !document.body || typeof MutationObserver !== 'function') {
        return () => {}
      }
      const actions = createMessageActions(ctx)
      const pass = () => {
        try {
          enhanceEffortMenus(document)
          markPermissionMenus(document)
          actions.decorate(document)
        } catch (error) {
          console.error('[custom-dsh-theme] feature pass failed:', error)
        }
      }
      let timer = 0
      const schedule = () => {
        if (timer) return
        timer = setTimeout(() => {
          timer = 0
          pass()
        }, 16)
      }
      pass()
      // Streaming answers add text and markdown nodes on every token; only a
      // batch that brings a menu or a message row in is worth a pass.
      // The host reuses one menu node and swaps its rows when a submenu opens,
      // so the rows themselves are relevant too, not only a new menu.
      const RELEVANT =
        '[role="menu"],[role="menuitem"],[role="menuitemradio"],[data-turn-tail],[data-chat-flow-kind="user"],[class*="_actions"]'
      const observer = new MutationObserver((records) => {
        if (timer) return
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (node.nodeType !== 1) continue
            if (node.matches(RELEVANT) || node.querySelector(RELEVANT)) {
              schedule()
              return
            }
          }
        }
      })
      observer.observe(document.body, { childList: true, subtree: true })
      return () => {
        observer.disconnect()
        if (timer) clearTimeout(timer)
        actions.dispose()
        for (const node of document.querySelectorAll('[data-kat-effort]')) node.remove()
        for (const node of document.querySelectorAll('[data-kat-effort-menu]')) node.removeAttribute('data-kat-effort-menu')
      }
    }

    /* Styles for everything forked from claude-style. Host markup only:
       stable data attributes and aria labels first, CSS-module class
       prefixes (`[class*="_name"]`) only where the host offers nothing else. */
    const FEATURES_CSS = `
/* ---- Effort slider ---- */
${K} [data-kat-effort-menu]{min-width:min(280px,calc(100vw - 16px))}
${K} .kat-effort{display:flex;flex-direction:column;gap:6px;padding:10px 10px 8px;margin-bottom:4px;border-bottom:1px solid var(--dsw-alias-border-l1,#1f1f1f);font-family:var(--kat-font-mono)}
${K} .kat-effort-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;font-size:12px;line-height:16px}
${K} .kat-effort-title{color:var(--dsw-alias-label-tertiary,#8a8a8a);letter-spacing:.06em;text-transform:uppercase;font-size:10.5px}
${K} .kat-effort-value{color:var(--dsw-alias-brand-primary,#7dd3fc)}
${K} .kat-effort-track{position:relative;height:28px;margin:0 8px;cursor:pointer;touch-action:none;outline:none}
${K} .kat-effort-track::before{content:"";position:absolute;left:-8px;right:-8px;top:50%;height:4px;margin-top:-2px;background:var(--dsw-alias-bg-layer-3,#191a1d);border:1px solid var(--dsw-alias-border-l1,#2a2b31)}
${K} .kat-effort-fill{position:absolute;left:-8px;top:50%;height:4px;margin-top:-2px;background:var(--dsw-alias-brand-primary,#7dd3fc);transition:width .18s cubic-bezier(.34,1.56,.64,1)}
${K} .kat-effort-ticks{position:absolute;inset:0;pointer-events:none}
${K} .kat-effort-tick{position:absolute;top:50%;width:2px;height:8px;margin:-4px 0 0 -1px;background:var(--dsw-alias-label-dimmed,#4a4b53)}
${K} .kat-effort-knob{position:absolute;top:50%;width:12px;height:20px;margin:-10px 0 0 -6px;background:var(--dsw-alias-label-primary,#f2f2f2);border:1px solid var(--dsw-alias-bg-base,#0b0b0c);transition:left .18s cubic-bezier(.34,1.56,.64,1),transform .12s ease}
${K} .kat-effort[data-dragging] .kat-effort-knob{transform:scale(1.15);transition:transform .12s ease}
${K} .kat-effort[data-dragging] .kat-effort-fill{transition:none}
${K} .kat-effort-track:focus-visible .kat-effort-knob{outline:2px solid var(--dsw-alias-brand-primary,#7dd3fc);outline-offset:2px}
${K} .kat-effort-ends{display:flex;justify-content:space-between;font-size:10.5px;color:var(--dsw-alias-label-dimmed,#6b6b6b)}

/* ---- Permission menu: check the preset in force ---- */
${K} [role="menu"][data-kat-perm] [role="menuitem"]{position:relative;padding-right:28px}
${K} [role="menu"][data-kat-perm] [role="menuitem"][data-kat-current]{color:var(--dsw-alias-label-primary,#f2f2f2)}
${K} [role="menu"][data-kat-perm] [role="menuitem"][data-kat-current]::after{content:"";position:absolute;right:10px;top:50%;width:6px;height:6px;margin-top:-3px;background:var(--dsw-alias-brand-primary,#7dd3fc)}
${K} button[aria-label^="Access mode"]{font-family:var(--kat-font-mono);font-size:12px}

/* ---- Context ring: thin square-capped ring, mono figure ---- */
${K} button[aria-label$="of context used"]{font-family:var(--kat-font-mono);font-size:11.5px;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-secondary,#a3a3a3)}
${K} button[aria-label$="of context used"] circle:last-of-type{stroke:var(--dsw-alias-brand-primary,#7dd3fc);stroke-linecap:butt}

/* ---- Turn rail: dashes, the current turn lit ---- */
${K} nav[aria-label="Turn navigation"] button{width:18px;height:2px;background:var(--dsw-alias-border-l4,#4a4b53);opacity:.7;transition:background-color .15s ease,width .15s ease,opacity .15s ease}
${K} nav[aria-label="Turn navigation"] button:hover{opacity:1;width:22px}
${K} nav[aria-label="Turn navigation"] button[aria-current="true"]{background:var(--dsw-alias-brand-primary,#7dd3fc);opacity:1;width:22px}

/* ---- Message actions ---- */
${K} [data-kat-actions]{display:inline-flex;align-items:center;gap:2px}
${K} .kat-action{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;border:0;background:none;color:var(--dsw-alias-label-tertiary,#8a8a8a);cursor:pointer}
${K} .kat-action:hover{background:var(--dsw-alias-interactive-bg-hover,#161616);color:var(--dsw-alias-label-primary,#f2f2f2)}
${K} .kat-action:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#7dd3fc);outline-offset:-2px}
${K} .kat-editor{display:flex;flex-direction:column;gap:8px;margin-top:8px;padding:10px;background:var(--dsw-alias-bg-layer-2,#141417);border:1px solid var(--dsw-alias-border-l3,#3a3b42)}
${K} .kat-editor-input{width:100%;box-sizing:border-box;resize:vertical;min-height:48px;padding:8px;background:var(--dsw-alias-bg-base,#0b0b0c);color:var(--dsw-alias-label-primary,#f2f2f2);border:1px solid var(--dsw-alias-border-l1,#2a2b31);font:inherit;caret-color:var(--dsw-alias-brand-primary,#7dd3fc)}
${K} .kat-editor-row{display:flex;justify-content:flex-end;gap:8px}
${K} .kat-editor-row button{padding:6px 12px;border:1px solid var(--dsw-alias-border-l3,#3a3b42);background:none;color:var(--dsw-alias-label-secondary,#a3a3a3);font-family:var(--kat-font-mono);font-size:12px;cursor:pointer}
${K} .kat-editor-row .kat-editor-save{background:var(--dsw-alias-brand-primary,#7dd3fc);border-color:var(--dsw-alias-brand-primary,#7dd3fc);color:var(--dsw-alias-brand-text,#04121a)}
${K} .kat-editor-row .kat-editor-save:disabled{opacity:.4;cursor:default}

/* ---- Process summary rows ("2 thoughts, 3 tool calls"): one mono line ---- */
${K} button[data-process-activity]{font-family:var(--kat-font-mono);font-size:12px;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-tertiary,#8a8a8a)}
${K} button[data-process-activity]:hover{color:var(--dsw-alias-label-primary,#f2f2f2)}

/* ---- File-op rows: Edit path +n -m ---- */
${K} :is([data-tool="edit"],[data-tool="write"],[data-tool="read"]) [class*="_title"]{font-family:var(--kat-font-mono);font-size:12px;color:var(--dsw-alias-label-secondary,#a3a3a3)}
${K} :is([data-tool="edit"],[data-tool="write"]) [class*="_fileLink"]{font-family:var(--kat-font-mono);font-size:12px}
${K} [class*="_diffAdded"]{color:var(--dsw-alias-state-success-primary,#6ee7a8);font-family:var(--kat-font-mono)}
${K} [class*="_diffRemoved"]{color:var(--dsw-alias-state-error-primary,#f87171);font-family:var(--kat-font-mono)}

/* ---- Running session rows: a slow sweep across the title ---- */
@keyframes kat-row-sweep{0%{background-position:150% 0}100%{background-position:-50% 0}}
${K}[data-kat-motion="full"] [class*="_sessionRow"]:has(svg[data-state="ongoing"]) [class*="_title"]{
  background:linear-gradient(90deg,var(--dsw-alias-label-secondary,#a3a3a3) 40%,var(--dsw-alias-label-primary,#f2f2f2) 50%,var(--dsw-alias-label-secondary,#a3a3a3) 60%) 0 0/200% 100%;
  -webkit-background-clip:text;background-clip:text;color:transparent;
  animation:kat-row-sweep 2.4s linear infinite;
}

/* ---- Sidebar search: a standing field, not a hidden icon ---- */
${K} [class*="_sectionHeader"]:has(> [class*="_searchSlot"]){flex-wrap:wrap;row-gap:6px;justify-content:space-between}
${K} [class*="_sectionHeader"]:has(> [class*="_searchSlot"]) > [class*="_sectionLabel"]{margin-right:auto}
${K} [class*="_search"]:has(> [class*="_searchInput"]){width:100%;height:30px;border:1px solid var(--dsw-alias-border-l1,#2a2b31);background:var(--dsw-alias-bg-layer-1,#101012)}
${K} [class*="_searchSlot"]{order:9;flex:1 0 100% !important;max-width:100% !important;margin-left:0 !important}
${K} [class*="_searchInput"]{font-family:var(--kat-font-mono);font-size:12px;opacity:1 !important;width:100% !important;pointer-events:auto !important}
${K} [class*="_search"]:focus-within{border-color:var(--dsw-alias-brand-primary,#7dd3fc)}

/* ---- Sidebar footer: one compact band ---- */
${K} [class*="_footArea"]{border-top:1px solid var(--dsw-alias-border-l1,#1f1f1f);padding-block:6px !important;gap:4px;font-family:var(--kat-font-mono);font-size:11.5px}
${K} [class*="_footArea"] button{min-height:28px}

/* ---- Chat reveal: new answer blocks settle in ---- */
@keyframes kat-reveal{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}
${K}[data-kat-reveal] [data-chat-flow-kind="assistant-step"]:last-child{animation:kat-reveal .22s ease-out both}

/* ---- Typing caret: accent coloured in every field ---- */
${K} :is([data-composer-input],textarea,input){caret-color:var(--dsw-alias-brand-primary,#7dd3fc)}

/* ---- Phone: light motion and thumb-sized targets ----
   Decorative loops, reveals and blur are paint every frame on a weak GPU;
   they stop here. The orb keeps moving (at a reduced rate, set in JS) and
   real progress indicators keep spinning, so state is never hidden. */
${K}[data-kat-mobile] [class*="_sessionRow"] [class*="_title"]{animation:none !important;background:none !important;color:inherit !important}
${K}[data-kat-mobile] [data-chat-flow-kind]{animation:none !important}
${K}[data-kat-mobile] *{backdrop-filter:none !important;-webkit-backdrop-filter:none !important}
${K}[data-kat-mobile] :is(button,[role="button"],[role="menuitem"],[role="menuitemradio"],[role="tab"]){min-height:40px}
${K}[data-kat-mobile] .kat-action{width:40px;height:40px}
${K}[data-kat-mobile] .kat-effort-track{height:40px}
${K}[data-kat-mobile] .kat-effort-knob{width:18px;height:28px;margin:-14px 0 0 -9px}
${K}[data-kat-mobile] [role="menu"] [role^="menuitem"]{font-size:14px}
${K}[data-kat-mobile] :where(button,a,input,textarea,select,[role="button"],[role="option"],[role="tab"]){transition:none}
`

    /* claude-style's spacing, type scale and motion, copied value for value
       (measured from a live page with claude-style on vs off) and retargeted
       from its injected data-dsh-claude-part names onto the host's own
       markup. The surface stays KAT: no radius, no soft card shadows, mono
       chrome. Motion that is pure decoration plays only under Motion: Full. */
    const CLAUDE_PORT_CSS = `
/* ---- claude-style spacing, type and motion ---- */
body[data-kat-theme]{
  --kat-dur-instant:80ms;--kat-dur-feedback:.12s;--kat-dur-surface:.15s;--kat-dur-roll:.16s;
  --kat-dur-move:.2s;--kat-dur-slide:.24s;--kat-dur-open:.25s;--kat-dur-fade:.3s;
  --kat-dur-enter:.32s;--kat-dur-rise:.5s;
  --kat-ease-glide:cubic-bezier(.22,.61,.36,1);--kat-ease-settle:cubic-bezier(.22,1,.36,1);
  --kat-ease-roll:cubic-bezier(.4,0,.2,1);--kat-ease-enter:cubic-bezier(.34,1.3,.64,1);
  --kat-ease-status:cubic-bezier(.45,0,.55,1);
  --kat-distance-nudge:4px;--kat-distance-rise:12px;
  --kat-scale-dropdown:.97;--kat-scale-surface:.98;
}

/* Sidebar: 28px rows, 6px inline padding, 13px titles */
${K} [class*="_newSession"]:not([class*="_newSessionL"]):not([class*="_newSessionC"]):not([class*="_newSessionS"]){
  display:flex;align-items:center;justify-content:flex-start;box-sizing:border-box;
  height:28px;min-height:28px;line-height:28px;padding:0 8px;gap:6px;margin-bottom:6px;
  border:0 !important;font-size:13px;
  transition:background-color var(--kat-dur-feedback) ease;
}
${K} [class*="_newSession"] :is([class*="_newSessionLabel"],[class*="_newSessionContent"]){font-size:13px;line-height:28px}
${K} [class*="_panelList"]{gap:0}
${K} [class*="_panelRow"]{
  box-sizing:border-box;min-height:28px;height:28px;line-height:28px;padding:0 8px;margin-bottom:0;
  font-size:13px;font-weight:500;transition:background-color var(--kat-dur-feedback) ease;
}
${K} [class*="_panelRow"] svg{width:16px;height:16px;margin:0 2px;flex:none}
${K} [class*="_sectionLabel"]{font-size:12px;line-height:16px;font-weight:500;color:var(--dsw-alias-label-tertiary,#8a8a8a)}
${K} [class*="_projectRow"]{display:flex;align-items:center;height:28px;min-height:28px;padding:0 6px;padding-inline:6px;padding-inline-start:calc(6px + var(--dsh-workspace-indent,0px));gap:4px;background:transparent}
${K} [class*="_projectRow"] [class*="_title"]{font-size:13px;line-height:18px;font-weight:500;color:var(--dsw-alias-label-secondary,#a3a3a3)}
${K} [class*="_projectRow"]:hover [class*="_title"]{color:var(--dsw-alias-label-primary,#f2f2f2)}
${K} [class*="_sessionRow"]{height:28px;min-height:28px;padding:0 6px;padding-inline:6px;padding-inline-start:calc(6px + var(--dsh-workspace-indent,0px));gap:0;transition:background-color var(--kat-dur-feedback) ease}
${K} [class*="_sessionRow"] [class*="_title"]{font-size:13px;line-height:18px;font-weight:500;margin:0 4px;color:var(--dsw-alias-label-secondary,#a3a3a3);transition:color var(--kat-dur-feedback) ease}
${K} [class*="_sessionRow"]:is(:hover,[aria-selected="true"],[class*="_selected"]) [class*="_title"]{color:var(--dsw-alias-label-primary,#f2f2f2)}
${K} [class*="_sessionRow"] [class*="_time"]{font-size:11px;line-height:16px;font-variant-numeric:tabular-nums}
${K} :is([class*="_projectRow"],[class*="_sessionRow"]) [class*="_rowActions"]{gap:6px}
${K} [class*="_sessionOverflowButton"]{padding-left:26px;margin-top:1px}
${K} [class*="_footArea"]{padding-inline:8px;margin-bottom:-6px}

/* Header: crumb hover, quiet view area under the transcript */
${K} [class*="_crumb"]{transition:background-color var(--kat-dur-feedback) ease}
${K} [class*="_viewArea"]{padding-bottom:40px}

/* Transcript: process rows tight, prose at 25px */
${K} button[data-process-activity],
${K} button[data-process-activity] :is([class*="_leading"],[class*="_activityIcon"],[class*="_chevron"],[class*="_label"]){
  line-height:15px;font-weight:500;letter-spacing:-.12px;
}
${K} [data-tool] [class*="_title_"]{line-height:17.5px;font-weight:500;letter-spacing:-.14px}
${K} [class*="_markdown_"]{line-height:25px}
${K} [class*="_markdown_"] p{margin:12px 0}
${K} [class*="_markdown_"] :is(h1,h2,h3){margin-top:24px;margin-bottom:12px}
${K} [class*="_markdown_"] :is(h1,h2,h3)+:is(h1,h2,h3){margin-top:8px}
${K} [class*="_markdown_"] :is(h4,h5,h6){margin-top:16px;margin-bottom:8px}
${K} [class*="_tableScroll"]{border-top:1px solid var(--dsw-alias-border-l1,#2a2b31);border-bottom:1px solid var(--dsw-alias-border-l1,#2a2b31)}
${K} [class*="_actions"][data-clock]{transition-duration:var(--dsh-dur-feedback,.12s)}

/* Composer: 15px type, 8px gaps, 2px bottom, hairline card */
${K} [data-composer-card]{font-size:15px;gap:8px;padding-bottom:2px;min-height:0;border:1px solid var(--dsw-alias-border-l1,#2a2b31);transition:border-color var(--kat-dur-feedback) ease}
${K} [data-composer-card]:focus-within{border-color:var(--dsw-alias-border-l4,#4a4b53)}
${K} [data-composer-card] [class*="_row"]{padding-bottom:2px;gap:4px 12px;min-height:28px}
${K} [data-composer-card] [class*="_tools"],${K} [data-composer-card] [class*="_trailing"]{max-width:100%}
${K} [data-composer-card] button[class*="_primary"]{font-weight:500;border:1px solid transparent}
${K} [data-composer-card] [class*="_triggerEffort"]{font-size:14px}
${K} [class*="_dock"][data-composer-dock]{padding-top:0}

${K} [data-composer-card] [data-composer-input]{min-height:24px;line-height:24px;padding:0;font-size:14px}
/* claude pads the scroll wrapper, not the editor: text and placeholder share
   the same 14px inset, with room on the right for the overlay button */
${K} [data-composer-card] [data-input-scroll]{padding:7px 36px 7px 14px;box-sizing:border-box}
${K} [class*="_composerHero"] [data-composer-card] [data-input-scroll]{padding:4px 14px 7px}
${K} [data-composer-card] [data-input-scroll] [class*="_placeholder"]{left:0;right:0;top:0}
${K} [data-composer-card] [class*="_placeholder"]{line-height:24px;font-size:14px}
${K} [data-composer-card] [class*="_grow"]{min-height:24px}
${K} [data-composer-card] [class*="_row"]{display:flex;flex-wrap:nowrap;justify-content:space-between;align-items:center;padding:0 4px 2px;margin:6px 0 0}
${K} [data-composer-card] :is([class*="_tools"],[class*="_trailing"]){gap:8px}
${K} [data-composer-card] button[class*="_primary"]{padding:0;min-height:0;transition:background-color var(--kat-dur-feedback) ease,color var(--kat-dur-feedback) ease}
${K} [data-composer-card] [class*="_activity"]{min-height:0}
${K} [class*="_dock"][data-composer-dock]{min-height:0}
${K} button[aria-label$="of context used"]{display:inline-flex;align-items:center;gap:6px;height:22px;padding:1px 0 1px 8px;line-height:20px;font-weight:500}
${K} button[aria-label$="of context used"] circle{stroke-width:2px}
${K} [data-slot="sidebar.settings"] button[aria-label="Account menu"]{font-size:13px;font-weight:500}
${K} [class*="_title_"][class*="_text_"]{line-height:17.5px;font-weight:500;letter-spacing:-.14px}
${K} button[data-process-activity] [class*="_label"]{min-height:0}
${K} [class*="_panelRow"]{margin-bottom:6px}
${K} [class*="_panelList"] [class*="_panelRow"]:last-child{margin-bottom:0}
${K} [class*="_sectionLabel"]{transition:opacity var(--kat-dur-surface) ease}
${K} [class*="_searchSlot"]{min-height:0}

/* Home hero: claude's larger, tighter headline and its separated workspace row */
${K} [class*="_headline"]{font-size:44.2px;line-height:54.4px;font-weight:400;letter-spacing:-.663px}
${K} [class*="_composerHero"] [data-composer-card] [data-composer-input]{min-height:86px;line-height:26px;font-size:15px}
${K} [class*="_composerHero"] [data-composer-card] [class*="_placeholder"]{line-height:26px;font-size:15px}
/* Hero: claude seats the workspace row under the card as its footer strip */
${K} [class*="_composerHero"]{display:flex;flex-direction:column;gap:0}
${K} [class*="_composerHero"] > [class*="_root"]{margin-bottom:24px}
${K} [class*="_composerHero"] > [class*="_heroWorkspaceRow"]{order:2;margin-top:-1px !important;width:100%;max-width:var(--dsh-composer-card-max-width,876.8px);align-self:center;box-sizing:border-box;padding:8px 16px;border:1px solid var(--dsw-alias-border-l1,#2a2b31);border-top:0;background:var(--dsw-alias-bg-layer-1,#101012)}
${K} [class*="_composerHero"] > :not([class*="_root"]):not([class*="_heroWorkspaceRow"]){order:1}
/* Sidebar: claude drops the folder glyph and the filled new-session block */
${K} [class*="_projectRow"] [class*="_folder"]{display:none}
${K} button[class*="_newSession"]{background:transparent !important;justify-content:flex-start !important}
${K} button[class*="_newSession"]:hover{background:var(--dsw-alias-interactive-bg-hover,#161616) !important}
${K} button[class*="_newSession"] [class*="_newSessionContent"]{justify-content:flex-start;gap:8px}
${K} [class*="_heroWorkspaceRow"]{transition:border-color var(--kat-dur-feedback) ease}

/* ---- Motion (claude timings), only under Motion: Full ---- */
@keyframes kat-dropdown-in{from{opacity:0;transform:scale(var(--kat-scale-dropdown))}to{opacity:1;transform:none}}
@keyframes kat-surface-in{from{opacity:0;transform:translateY(var(--kat-distance-nudge)) scale(var(--kat-scale-surface))}to{opacity:1;transform:none}}
@keyframes kat-hero-rise{from{opacity:0;transform:translateY(var(--kat-distance-rise))}to{opacity:1;transform:none}}
@keyframes kat-roll-in{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:none}}
@keyframes kat-enter-grow{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes kat-title-shine{0%,15%{background-position:83.333% 0}85%,to{background-position:16.667% 0}}
${K}[data-kat-motion="full"] [role="menu"][data-menu-material]{transform-origin:top left;animation:kat-dropdown-in var(--kat-dur-open) var(--kat-ease-settle) both}
${K}[data-kat-motion="full"] [role="dialog"]{animation:kat-surface-in var(--kat-dur-open) var(--kat-ease-settle) both}
${K}[data-kat-motion="full"] :is([class*="_titleGroup"],[class*="_fishHitbox"]){animation:kat-hero-rise var(--kat-dur-rise) var(--kat-ease-settle) both}
${K}[data-kat-motion="full"] [data-step-process-body]:not([hidden]){animation:kat-surface-in var(--kat-dur-surface) var(--kat-ease-glide) both}
${K}[data-kat-motion="full"] [data-chat-flow-kind="user"]:last-of-type [class*="_bubble"]{transform-origin:100% 100%;animation:kat-enter-grow var(--kat-dur-enter) var(--kat-ease-enter) both}
${K}[data-kat-motion="full"] [class*="_diffStat"]{display:inline-block;overflow:hidden;animation:kat-roll-in var(--kat-dur-roll) var(--kat-ease-roll) both}
${K}[data-kat-motion="full"] [data-chat-running] [class*="_runningText"] [class*="_text"]{
  background:linear-gradient(90deg,var(--dsw-alias-label-tertiary,#8a8a8a) 0 33.333%,var(--dsw-alias-label-primary,#f2f2f2) 50%,var(--dsw-alias-label-tertiary,#8a8a8a) 66.667% 100%) 0 0/300% 100%;
  -webkit-background-clip:text;background-clip:text;color:transparent;
  animation:kat-title-shine 3s var(--kat-ease-status) infinite;
}
${K}[data-kat-motion="full"] [class*="_panelRow"] svg{transition:transform var(--kat-dur-slide) ease}
${K}[data-kat-motion="full"] [class*="_panelRow"]:hover svg{transform:rotate(90deg)}
${K}[data-kat-motion="full"] .kat-effort-value{transition:opacity var(--kat-dur-move) var(--kat-ease-glide)}
/* ---- end claude-style port */
`

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
  /* claude-style measures the settings-trigger row and writes its width to
     the body. Collapsing the rail shrinks that measurement (260px -> 35px),
     and changing a body custom property restyles the whole document. The
     value only sizes the account popover, so pin it and skip that recalc. */
  --dsh-claude-account-width:260px !important;
}
${K}[data-kat-prose="mono"]{
  --kat-font-prose:var(--kat-font-mono);
  --dsh-claude-font-prose:var(--kat-font-mono);
  --dsh-claude-font-serif:var(--kat-font-mono);
}
body[data-kat-density="compact"]{--kat-prose-gap:12px;--kat-row-pad:6px}

/* The layout frame animates grid-template-columns while the sidebar opens
   and closes. Every intermediate track size relayouts the whole transcript,
   so one toggle costs ~1.4s of style recalc across five passes. Snap the
   tracks instead: the rail is 56px wide, and the motion read as a slideshow
   rather than polish. */
${K} [data-dsh-claude-part~="layout-frame"]{
  transition:none !important;
}

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

/* Status lights become orbs too: the dot keeps its place in the layout and
   only its paint is hidden. */
${K} [data-state="done"][data-kat-orb-hidden],
${K} [data-state="warning"][data-kat-orb-hidden]{
  visibility:hidden !important;
}

/* The composer orb lives on the composer's own containing block, which exists
   even while claude-style unmounts the mascot, so it does not blink out. */
${K} .kat-composer-orb{
  position:absolute !important;
  z-index:2;
  pointer-events:auto;
  cursor:pointer;
}
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

${K} [data-kat-orb-deepy]{
  z-index:2;
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

${CLAUDE_PORT_CSS}

${FEATURES_CSS}

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
      'data-kat-reveal',
      'data-kat-mobile',
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
      const mobile = isMobilePage(
        globalThis,
        (query) => typeof matchMedia === 'function' && matchMedia(query).matches,
      )
      if (mobile) orbFrameMs = MOBILE_ORB_FRAME_MS

      const paint = () => {
        body.setAttribute('data-kat-theme', '')
        if (mobile) body.setAttribute('data-kat-mobile', '')
        else body.setAttribute('data-kat-reveal', '')
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

      // Everything forked from claude-style: one batched observer drives the
      // effort slider, permission check marks, row shimmer and message actions.
      const stopFeatures = installFeatures(ctx)

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
          // The composer orb sits on the card's top-right corner, where the
          // claude-style mascot used to stand; 56px reads as a presence there
          // without covering the transcript.
          const COMPOSER_ORB_SIZE = 56
          const done = new WeakSet()

          const mountBootOrb = () => {
            const boot = document.querySelector('[data-dsh-boot]')
            if (!boot) return
            const spinner = boot.querySelector('[data-dsh-boot-spinner]')
            if (!spinner || done.has(spinner) || spinner.parentElement === null) return
            const orb = createOrb(56, 'Loading the harness', { state: 'working' })
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
            const size = Math.max(18, width)
            const orb = createOrb(size, 'Working', { state: 'working' })
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

          const activityState = () => readActivity(document)

          let composerOrb = null
          let composerAnchorEl = null
          let composerCard = null

          // The mascot is unmounted for stretches of a turn, and the orb must
          // not leave with it: anchor to the block the mascot sits in, which
          // outlives it, and fall back to the composer's positioned ancestor.
          // Resolving this walks the document and calls getComputedStyle, which
          // forces a style flush. The transcript mutates on every token, so the
          // result is cached until the host actually remounts the composer.
          const composerAnchor = () => {
            if (composerAnchorEl && composerAnchorEl.isConnected) return composerAnchorEl
            let el = document.querySelector('[class*="composerStack"]')
            while (el && el !== document.body && getComputedStyle(el).position === 'static') {
              el = el.parentElement
            }
            composerAnchorEl = el && el !== document.body ? el : null
            return composerAnchorEl
          }

          const currentCard = () => {
            if (composerCard && composerCard.isConnected) return composerCard
            composerCard = document.querySelector('[data-composer-card]')
            return composerCard
          }

          // The mascot sat at the composer card's top-right. Anchoring to the
          // sticky seat and offsetting from the card keeps that spot stable
          // while the card resizes with the prompt, without the card clipping it.
          // The canvas size is already in its inline style, so placement never
          // measures the orb; and it only writes when the spot actually moved.
          const placeComposerOrb = (element) => {
            const anchor = element.parentElement
            const card = currentCard()
            if (!anchor || !card) return
            const a = anchor.getBoundingClientRect()
            const c = card.getBoundingClientRect()
            const width = parseFloat(element.style.width) || element.offsetWidth || 0
            const height = parseFloat(element.style.height) || element.offsetHeight || 0
            const left = `${Math.round(c.right - a.left - width - 8)}px`
            const top = `${Math.round(c.top - a.top - height + 4)}px`
            if (element.style.left !== left) element.style.left = left
            if (element.style.top !== top) element.style.top = top
          }

          let cardObserver = null
          const watchCard = () => {
            if (typeof ResizeObserver !== 'function') return
            const card = currentCard()
            if (!card) return
            if (cardObserver) cardObserver.disconnect()
            cardObserver = new ResizeObserver(() => {
              if (composerOrb && composerOrb.element.isConnected) placeComposerOrb(composerOrb.element)
            })
            cardObserver.observe(card)
          }

          const mountComposerOrb = () => {
            const anchor = composerAnchor()
            if (!anchor) return
            if (composerOrb && composerOrb.element.isConnected) {
              if (composerOrb.element.parentElement !== anchor) anchor.appendChild(composerOrb.element)
              placeComposerOrb(composerOrb.element)
              composerOrb.setState(activityState())
              watchCard()
              return
            }
            if (composerOrb) {
              try {
                composerOrb.dispose()
              } catch {
                /* already gone */
              }
              composerOrb = null
            }
            const orb = createOrb(COMPOSER_ORB_SIZE, 'Thinking orb', {
              playful: true,
              state: activityState(),
            })
            if (!orb) return
            orb.element.classList.add('kat-composer-orb')
            orb.element.setAttribute('data-kat-orb-deepy', '')
            anchor.appendChild(orb.element)
            placeComposerOrb(orb.element)
            // The host's own bubble is inert in this build, so the orb answers
            // a click itself.
            orb.element.addEventListener('pointerdown', (event) => {
              event.stopPropagation()
              orb.poke()
            })
            composerOrb = orb
            watchCard()
          }

          const STATUS_ORBS = {
            done: { state: 'done', ink: '--dsw-alias-state-success-primary', fallback: '#6ee7a8', label: 'Finished' },
            warning: { state: 'warning', ink: '--dsw-alias-state-warn-primary', fallback: '#fbbf24', label: 'Needs attention' },
          }

          const mountStatusOrb = (dot) => {
            if (done.has(dot)) return
            const config = STATUS_ORBS[dot.getAttribute('data-state')]
            if (!config) return
            const host = dot.parentElement
            if (!host) return
            const box = dot.getBoundingClientRect ? dot.getBoundingClientRect() : null
            const width = Math.round((box && box.width) || 0) || 10
            const size = Math.max(13, width)
            const orb = createOrb(size, config.label, {
              state: config.state,
              ink: tokenInk(config.ink, config.fallback),
            })
            if (!orb) return
            done.add(dot)
            dot.setAttribute('data-kat-orb-hidden', '')
            host.classList.add('kat-orb-host')
            const hostBox = host.getBoundingClientRect ? host.getBoundingClientRect() : null
            if (box && hostBox) {
              orb.element.style.left = `${box.left - hostBox.left - (size - width) / 2}px`
              orb.element.style.top = `${box.top - hostBox.top - (size - width) / 2}px`
            } else {
              orb.element.style.left = '0px'
              orb.element.style.top = '0px'
            }
            orb.element.setAttribute('data-kat-orb-status', config.state)
            host.appendChild(orb.element)
            live.push({ orb, host, spinner: dot })
          }

          const scanAll = () => {
            try {
              prune()
              mountBootOrb()
              mountComposerOrb()
              for (const dot of document.querySelectorAll('[data-state="done"],[data-state="warning"]')) {
                mountStatusOrb(dot)
              }
              for (const svg of document.querySelectorAll('svg[data-state="ongoing"]')) {
                mountRowOrb(svg)
              }
            } catch {
              /* one bad node must not stop the rest */
            }
          }
          scanAll()

          // Chat streams mutate the DOM on every token. Re-scanning the whole
          // document for each batch is what made the UI lag; inspect only the
          // added/removed subtrees and the attributes this feature reacts to.
          const scanAdded = (node, flags) => {
            if (!node || node.nodeType !== 1) return
            if (node.matches?.('[data-composer-card]') || node.querySelector?.('[data-composer-card]')) {
              flags.composer = true
            }
            if (node.matches?.('svg[data-state="ongoing"]')) mountRowOrb(node)
            for (const svg of node.querySelectorAll?.('svg[data-state="ongoing"]') || []) mountRowOrb(svg)
            if (node.matches?.('[data-state="done"],[data-state="warning"]')) mountStatusOrb(node)
            for (const dot of node.querySelectorAll?.('[data-state="done"],[data-state="warning"]') || []) {
              mountStatusOrb(dot)
            }
          }

          const onMutations = (records) => {
            const flags = { composer: !composerOrb || !composerOrb.element.isConnected, state: false }
            for (const record of records) {
              if (record.type === 'attributes') {
                const target = record.target
                if (record.attributeName === 'data-state') {
                  if (target.matches?.('[data-state="done"],[data-state="warning"]')) mountStatusOrb(target)
                  else if (target.matches?.('svg[data-state="ongoing"]')) mountRowOrb(target)
                }
                continue
              }
              for (const node of record.addedNodes) scanAdded(node, flags)
              for (const node of record.removedNodes) {
                if (!node || node.nodeType !== 1) continue
                if (composerAnchorEl && (node === composerAnchorEl || node.contains?.(composerAnchorEl))) {
                  composerAnchorEl = null
                  flags.composer = true
                }
                if (composerCard && (node === composerCard || node.contains?.(composerCard))) {
                  composerCard = null
                }
                if (composerOrb && (node === composerOrb.element || node.contains?.(composerOrb.element))) {
                  flags.composer = true
                }
              }
            }
            try {
              prune()
              if (flags.composer) mountComposerOrb()
            } catch {
              /* one bad node must not stop the rest */
            }
            scheduleState()
          }

          // Any batch can start, advance or end a turn (the running marker
          // comes and goes as a node, reasoning turns into a response, a tool
          // finishes), so the state is re-read once per frame after mutations
          // rather than guessed from which nodes changed. setState is a no-op
          // when the state holds. A timer, not a frame: frames stop while the
          // window is hidden or occluded, and the state must still be right
          // when the user looks back.
          let stateTimer = 0
          const scheduleState = () => {
            if (stateTimer || !composerOrb) return
            stateTimer = setTimeout(() => {
              stateTimer = 0
              if (composerOrb) composerOrb.setState(activityState())
            }, 120)
          }

          let observer = null
          if (typeof MutationObserver === 'function') {
            observer = new MutationObserver(onMutations)
            observer.observe(document.body, {
              childList: true,
              subtree: true,
              attributes: true,
              attributeFilter: ['data-state', 'data-chat-group-part'],
            })
          }

          const onResize = () => {
            if (composerOrb && composerOrb.element.isConnected) placeComposerOrb(composerOrb.element)
          }
          if (typeof addEventListener === 'function') addEventListener('resize', onResize)

          return () => {
            if (observer) observer.disconnect()
            if (stateTimer) clearTimeout(stateTimer)
            if (cardObserver) cardObserver.disconnect()
            if (typeof removeEventListener === 'function') removeEventListener('resize', onResize)
            if (composerOrb) {
              try {
                composerOrb.dispose()
              } catch {
                /* already gone */
              }
            }
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
          stopFeatures()
          stopOrbs()
          disposeLayer()
          disposeSheet()
          for (const name of SWITCHES) body.removeAttribute(name)
        },
        'custom-dsh-theme: palette, sheet and body switches',
      )

      globalThis.__KAT_THEME__ = { SOURCE, prefs, setAccent, setPref, reset, orbDots, readActivity, effort, isMobilePage }

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
