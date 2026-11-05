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

    const DEFAULTS = { accent: 'sky', density: 'comfortable', motion: 'calm', prose: 'sans' }

    function readPrefs(store) {
      const prefs = { ...DEFAULTS }
      try {
        const raw = store && store.getItem(PREF_KEY)
        if (!raw) return prefs
        const parsed = JSON.parse(raw)
        if (ACCENTS[parsed.accent]) prefs.accent = parsed.accent
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

    /** Both palette modes for every token this theme repaints. */
    function buildTokens(accentId) {
      const a = ACCENTS[accentId] || ACCENTS.sky
      const d = a.dark
      const l = a.light
      const pair = (dark, light) => ({ dark, light })

      return {
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
    }

    /* Three attribute repeats: claude-style ships !important radii at high
       class specificity, so the square rule must outrank it without editing it. */
    const K = 'html:root body[data-kat-theme][data-kat-theme][data-kat-theme]'

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
   signature uses a solid square instead, with no white ring line. */
@keyframes kat-square-spin{
  to{transform:rotate(1turn)}
}
${K} svg[data-state="ongoing"]{
  animation:kat-square-spin .85s linear infinite;
  border:0 !important;
  background-color:var(--dsw-alias-label-primary,#f2f2f2);
  border-radius:var(--kat-radius) !important;
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
`
    }

    const SWITCHES = ['data-kat-theme', 'data-kat-motion', 'data-kat-density', 'data-kat-prose', 'data-kat-accent']

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
      }
      paint()

      // buildTokens is pure per accent, and the re-assert path runs on every
      // host theme change; memoise so a scheme flip costs no rebuild.
      const tokenCache = new Map()
      const tokensFor = (accent) => {
        if (!tokenCache.has(accent)) tokenCache.set(accent, buildTokens(accent))
        return tokenCache.get(accent)
      }

      let disposeLayer = ctx.theme.overrideTokens(SOURCE, tokensFor(prefs.accent))

      // The host presenter owns the body's inline custom properties and
      // rewrites them wholesale from the snapshot it is handed. If our layer
      // ever drops out of that snapshot (a re-mount, a stale presenter pass)
      // the whole skin silently reverts to host paint, so re-assert instead of
      // assuming our first registration survives.
      const stackLayer = () => {
        disposeLayer()
        disposeLayer = ctx.theme.overrideTokens(SOURCE, tokensFor(prefs.accent))
      }
      const snapshotKeepsLayer = (snapshot) => {
        const tokens = snapshot?.active?.tokens
        if (tokens === undefined) return false
        const scheme = snapshot.active.colorScheme === 'light' ? 'light' : 'dark'
        for (const [name, pair] of Object.entries(tokensFor(prefs.accent))) {
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

      const setPref = (key, value) => {
        if (prefs[key] === value) return
        prefs[key] = value
        paint()
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
          disposeLayer()
          disposeSheet()
          for (const name of SWITCHES) body.removeAttribute(name)
        },
        'custom-dsh-theme: palette, sheet and body switches',
      )

      globalThis.__KAT_THEME__ = { SOURCE, prefs, setAccent, setPref, reset }

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
