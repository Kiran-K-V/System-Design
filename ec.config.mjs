import { defineEcConfig, ExpressiveCodeTheme } from 'astro-expressive-code';

// House code themes. Background is the site `surface`, accents are the site palette (crimson keywords, purple types, green strings).
const theme = (type, c) =>
  new ExpressiveCodeTheme({
    name: type,
    type,
    colors: {
      'editor.background': c.bg,
      'editor.foreground': c.fg,
      'editorLineNumber.foreground': c.muted,
      'editor.selectionBackground': c.sel,
      'editor.lineHighlightBackground': c.sel,
    },
    settings: [
      { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: c.muted, fontStyle: 'italic' } },
      { scope: ['string', 'string.quoted', 'markup.inserted'], settings: { foreground: c.str } },
      { scope: ['constant.numeric', 'constant.language', 'constant.character', 'support.constant'], settings: { foreground: c.num } },
      { scope: ['keyword', 'storage', 'storage.type', 'keyword.operator.new', 'keyword.control'], settings: { foreground: c.kw } },
      { scope: ['entity.name.function', 'support.function', 'meta.function-call'], settings: { foreground: c.fn } },
      { scope: ['entity.name.type', 'entity.name.class', 'support.type', 'support.class', 'entity.other.inherited-class'], settings: { foreground: c.type } },
      { scope: ['variable.parameter', 'entity.other.attribute-name', 'variable.other.property'], settings: { foreground: c.attr } },
      { scope: ['punctuation', 'keyword.operator'], settings: { foreground: c.punct } },
      { scope: ['markup.deleted'], settings: { foreground: c.kw } },
    ],
  });

export default defineEcConfig({
  themes: [
    theme('light', { bg: '#faf7f7', fg: '#1a1416', muted: '#6b5f63', sel: '#f1e6e8', str: '#15803d', num: '#b45309', kw: '#be123c', fn: '#5b3fd6', type: '#7c3aed', attr: '#0e7490', punct: '#6b5f63' }),
    theme('dark', { bg: '#1c1719', fg: '#f2ecec', muted: '#a99da1', sel: '#2e2428', str: '#4ade80', num: '#facc15', kw: '#ec5b72', fn: '#a995ff', type: '#c4b5fd', attr: '#67e8f9', punct: '#b8adb0' }),
  ],
  useDarkModeMediaQuery: true,
  themeCssSelector: (t) => `[data-theme='${t.type}']`,
  defaultProps: { wrap: false, showLineNumbers: false },
  styleOverrides: {
    borderRadius: '10px',
    borderColor: 'var(--border)',
    codeFontFamily: "'Geist Mono Variable', ui-monospace, SFMono-Regular, Menlo, monospace",
    codeFontSize: '0.86rem',
    codeLineHeight: '1.65',
    codePaddingBlock: '0.9rem',
    codePaddingInline: '1.1rem',
    uiFontFamily: "'Geist Variable', system-ui, sans-serif",
    frames: {
      frameBoxShadowCssValue: 'none',
      editorActiveTabIndicatorTopColor: 'var(--accent)',
      editorTabBarBorderBottomColor: 'var(--border)',
    },
  },
});
