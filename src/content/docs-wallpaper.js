/**
 * Clear Google Docs backgrounds and rotate local wallpapers once per minute.
 * Center frost (blurred wallpaper slice) sits under UI; black-themed chrome above.
 */
const INTERVAL_MS = 60_000;
const WALLPAPER_ID = 'stylus-docs-wallpaper-layer';
const VEIL_ID = 'stylus-docs-content-veil';
const STYLE_ID = 'stylus-docs-wallpaper-css';

const WALLPAPERS = [
  '15-49-4x_BSRGAN.jpg',
  '16-50-4x_BSRGAN.jpg',
  '17-45-4x_BSRGAN.jpg',
  'Arcane.S01E04.Happy.Progress.Day31.59.jpg',
  'Arcane.S01E05.Everybody.Wants.to.Be.My.Enemy29.08.jpg',
  'Arcane.S01E06.When.These.Walls.Come.Tumbling.Down29.42.jpg',
  'Arcane.S01E07.The.Boy.Savior.11.19.jpg',
  'Arcane.S01E09.The.Monster.You.Created.34.59.jpg',
  'Arcane.S01E09.The.Monster.You.Created.35.06.jpg',
  'Arcane.S01E09.The.Monster.You.Created.35.46.jpg',
].map(name => chrome.runtime.getURL(`wallpapers/${name}`));

/* Never use the `background` shorthand — it wipes thumbnail background-images. */
const CLEAR_CSS = `
:root {
  color-scheme: dark;
  --stylus-fg: #e8eaed;
  --stylus-fg-muted: #9aa0a6;
  --stylus-accent: #8ab4f8;
  --stylus-surface: #141416;
  --stylus-surface-soft: #1a1a1c;
  --stylus-border: rgba(255, 255, 255, 0.14);
  --stylus-search: rgba(255, 255, 255, 0.1);
  --stylus-frost-tint: rgba(0, 0, 0, 0.28);
  --stylus-frost-filter: blur(16px) brightness(0.72);
}

html, body {
  background-color: transparent !important;
  color: var(--stylus-fg) !important;
}

/* Transparent Docs chrome / homescreen surfaces (color only) */
body,
#docs-editor,
#docs-editor-container,
.docs-editor-container,
.docs-editor,
.kix-appview-editor,
.docs-suite-container,
.docs-homescreen-grid,
.docs-homescreen-container,
.docs-baselinesuite-grid,
#docs-chrome,
main,
[role="main"],
.docs-homescreen-templates-templateview-overview,
.docs-homescreen-templates-templateview,
.docs-homescreen-templates-templateview-header,
.docs-homescreen-templates-templateview-overview-container,
.docs-homescreen-floater,
[class*="homescreen-templates"],
[class*="templateview-overview"],
[class*="templateview-header"],
[class*="TemplateViewOverview"],
[class*="docs-homescreen-templates"] {
  background-color: transparent !important;
  color: var(--stylus-fg) !important;
  opacity: 1 !important;
  visibility: visible !important;
}

.kix-page,
.kix-page-paginated,
.kix-pagecanvas,
.kix-page-content-wrapper {
  background-color: rgba(20, 20, 22, 0.92) !important;
  color: var(--stylus-fg) !important;
}

#${WALLPAPER_ID} {
  position: fixed !important;
  inset: 0 !important;
  z-index: 0 !important;
  pointer-events: none !important;
  background-color: #111 !important;
  background-position: center !important;
  background-size: cover !important;
  background-repeat: no-repeat !important;
  isolation: isolate !important;
}

/*
 * Center frost: full-viewport wallpaper copy with a center-column mask.
 * No transform / background-attachment:fixed — both fight with filter:blur
 * and make the image appear to jump while scrolling.
 */
#${VEIL_ID} {
  position: fixed !important;
  inset: 0 !important;
  z-index: 1 !important;
  pointer-events: none !important;
  background-color: var(--stylus-frost-tint) !important;
  background-position: center !important;
  background-size: cover !important;
  background-repeat: no-repeat !important;
  filter: var(--stylus-frost-filter) !important;
  isolation: isolate !important;
  mask-image: linear-gradient(
    to right,
    transparent 0%,
    transparent calc(50% - min(620px, 49vw)),
    #000 calc(50% - min(620px, 49vw) + 24px),
    #000 calc(50% + min(620px, 49vw) - 24px),
    transparent calc(50% + min(620px, 49vw)),
    transparent 100%
  ) !important;
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0%,
    transparent calc(50% - min(620px, 49vw)),
    #000 calc(50% - min(620px, 49vw) + 24px),
    #000 calc(50% + min(620px, 49vw) - 24px),
    transparent calc(50% + min(620px, 49vw)),
    transparent 100%
  ) !important;
}

/* App UI above frost — do not use !important; sticky chrome is handled below */
body > *:not(#${WALLPAPER_ID}):not(#${VEIL_ID}) {
  position: relative;
  z-index: 2;
}

body,
#docs-chrome,
main,
[role="main"],
h1, h2, h3, h4,
.docs-homescreen-grid,
.docs-homescreen-container {
  color: var(--stylus-fg) !important;
  text-shadow: none !important;
}

a { color: var(--stylus-accent) !important; }

/*
 * Top Google bar + sticky wrappers — never bare [role=banner] alone
 * (that painted whole pages black). Docs pins the search chrome with
 * sticky/fixed ancestors; force normal flow so it scrolls away.
 */
#gb,
#gb[role="banner"],
header#gb,
header[role="banner"],
.stylus-scroll-flow,
.docs-homescreen-floater,
body > div:has(> #gb),
body > div:has(> header#gb),
body > div:has(> header[role="banner"]) {
  position: relative !important;
  top: auto !important;
  bottom: auto !important;
  inset: auto !important;
  transform: none !important;
}

#gb,
#gb[role="banner"],
header#gb,
header[role="banner"] {
  background-color: var(--stylus-surface) !important;
  color: var(--stylus-fg) !important;
  border-bottom: 1px solid var(--stylus-border) !important;
  z-index: 30 !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

#gb *,
header[role="banner"] * {
  color: var(--stylus-fg) !important;
  border-color: var(--stylus-border) !important;
}

#gb a,
#gb a *,
header[role="banner"] a,
header[role="banner"] a * {
  color: var(--stylus-fg) !important;
}

#gb form,
header[role="banner"] form,
form[role="search"],
#gb [role="search"],
header [role="search"] {
  background-color: var(--stylus-search) !important;
  border: 1px solid var(--stylus-border) !important;
  border-radius: 28px !important;
  color: var(--stylus-fg) !important;
  box-shadow: none !important;
}

#gb input,
#gb input[type="text"],
#gb input[type="search"],
header[role="banner"] input,
form[role="search"] input,
input[aria-label*="Search" i],
input[placeholder*="Search" i] {
  background-color: transparent !important;
  color: var(--stylus-fg) !important;
  caret-color: var(--stylus-fg) !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

#gb input::placeholder,
header[role="banner"] input::placeholder,
form[role="search"] input::placeholder,
input[aria-label*="Search" i]::placeholder,
input[placeholder*="Search" i]::placeholder {
  color: var(--stylus-fg-muted) !important;
  opacity: 1 !important;
}

#gb svg,
header[role="banner"] svg,
main svg,
[role="main"] svg {
  fill: var(--stylus-fg) !important;
  color: var(--stylus-fg) !important;
}

/* Simple dark menus */
.goog-menu,
.goog-menuitem,
.goog-menuitem-content {
  background-color: var(--stylus-surface) !important;
  color: var(--stylus-fg) !important;
}

.goog-menuitem-highlight,
.goog-menuitem-hover {
  background-color: rgba(255, 255, 255, 0.08) !important;
}

.stylus-recent-bar {
  /* Scroll away with the page — never sticky/fixed */
  position: relative !important;
  top: auto !important;
  bottom: auto !important;
  inset: auto !important;
  transform: none !important;
  background-color: var(--stylus-surface) !important;
  background-image: none !important;
  border-bottom: 1px solid var(--stylus-border) !important;
  color: var(--stylus-fg) !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  filter: none !important;
  text-shadow: none !important;
  box-shadow: none !important;
}

.stylus-recent-bar,
.stylus-recent-bar * {
  color: var(--stylus-fg) !important;
  border-color: var(--stylus-border) !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  text-shadow: none !important;
}

.stylus-recent-bar svg {
  fill: var(--stylus-fg) !important;
  color: var(--stylus-fg) !important;
}

.stylus-doc-footer {
  background-color: #141416 !important;
  background-image: none !important;
  color: #fff !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  filter: none !important;
  text-shadow: none !important;
}

.stylus-doc-footer,
.stylus-doc-footer * {
  color: #fff !important;
  border-color: var(--stylus-border) !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  text-shadow: none !important;
}

.stylus-doc-footer svg {
  fill: #fff !important;
  color: #fff !important;
}

.stylus-doc-card {
  background-color: transparent !important;
  text-shadow: none !important;
}

img, image, canvas, video,
[role="img"] {
  opacity: 1 !important;
  visibility: visible !important;
  filter: none !important;
}

input, textarea, select {
  background-color: rgba(0, 0, 0, 0.55) !important;
  color: var(--stylus-fg) !important;
  border-color: var(--stylus-border) !important;
  caret-color: var(--stylus-fg) !important;
}

input::placeholder,
textarea::placeholder {
  color: var(--stylus-fg-muted) !important;
}
`;

const START_NEW_RE = /start a new document/i;
const OWNED_BY_RE = /owned by/i;
const RECENT_DOCS_RE = /recent documents/i;
const TEMPLATE_GALLERY_RE = /template gallery/i;
const RGB_RE = /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i;
const RECENT_BAR_CLASS = 'stylus-recent-bar';
const DOC_FOOTER_CLASS = 'stylus-doc-footer';
const DOC_CARD_CLASS = 'stylus-doc-card';
const SCROLL_FLOW_CLASS = 'stylus-scroll-flow';
const PROTECTED_CHROME = `#gb, .${RECENT_BAR_CLASS}, .${DOC_FOOTER_CLASS}, .${SCROLL_FLOW_CLASS}`;
/** Index of the wallpaper currently painted — never advanced by mutation cleanup. */
let currentIndex = Math.floor(Math.random() * WALLPAPERS.length);
/** True while the user is actively scrolling — skip heavy clears that flash wallpaper. */
let scrolling = false;
let scrollIdleTimer = 0;

function ensureStyle() {
  let el = document.getElementById(STYLE_ID);
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    document.documentElement.appendChild(el);
  }
  el.textContent = CLEAR_CSS;
}

function punchShellBackground(el) {
  if (!el || el.id === WALLPAPER_ID || el.id === VEIL_ID) return;
  el.style.setProperty('background-color', 'transparent', 'important');
  const img = el.style.backgroundImage || getComputedStyle(el).backgroundImage;
  if (img && img !== 'none' && !/url\(/i.test(img)) {
    el.style.setProperty('background-image', 'none', 'important');
  }
}

function ensureLayers() {
  const parent = document.body || document.documentElement;
  document.documentElement.style.setProperty('background-color', 'transparent', 'important');
  document.documentElement.style.setProperty('background-image', 'none', 'important');
  if (document.body) {
    document.body.style.setProperty('background-color', 'transparent', 'important');
    document.body.style.setProperty('background-image', 'none', 'important');
  }

  if (!document.getElementById(WALLPAPER_ID)) {
    const layer = document.createElement('div');
    layer.id = WALLPAPER_ID;
    layer.setAttribute('aria-hidden', 'true');
    parent.prepend(layer);
  }
  if (!document.getElementById(VEIL_ID)) {
    const veilLayer = document.createElement('div');
    veilLayer.id = VEIL_ID;
    veilLayer.setAttribute('aria-hidden', 'true');
    document.getElementById(WALLPAPER_ID).after(veilLayer);
  }
  const wallpaper = document.getElementById(WALLPAPER_ID);
  const veil = document.getElementById(VEIL_ID);
  if (wallpaper && parent.firstChild !== wallpaper) parent.prepend(wallpaper);
  if (veil && wallpaper.nextSibling !== veil) wallpaper.after(veil);

  punchLargeShells();
  showWallpaper(currentIndex);
}

function punchLargeShells(root = document.body) {
  if (!root) return;
  const minW = window.innerWidth * 0.55;
  const minH = window.innerHeight * 0.35;
  const stack = [...root.children];
  let steps = 0;
  while (stack.length && steps < 60) {
    steps++;
    const el = stack.shift();
    if (!el || el.id === WALLPAPER_ID || el.id === VEIL_ID) continue;
    if (isTopChromeShell(el) || isThumbnailCard(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 80 || r.height < 40) continue;
    if (r.width >= minW || r.height >= minH || (r.width >= 500 && r.height >= 240)) {
      punchShellBackground(el);
    }
    if (r.width >= minW || r.height >= minH) {
      for (const child of el.children) stack.push(child);
    }
  }
}

function isThumbnailCard(el) {
  if (!el.querySelector?.('img, canvas, [role="img"]')) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.width < 280 && r.height > 0 && r.height < 340;
}

function parseRgba(colorStr) {
  if (!colorStr || colorStr === 'transparent') return null;
  const m = RGB_RE.exec(colorStr);
  if (m) {
    return {
      r: Number(m[1]),
      g: Number(m[2]),
      b: Number(m[3]),
      a: m[4] === undefined ? 1 : Number(m[4]),
    };
  }
  const hex = /^#([0-9a-f]{3,8})$/i.exec(colorStr.trim());
  if (hex) {
    let h = hex[1];
    if (h.length === 3 || h.length === 4) h = [...h].map(ch => ch + ch).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
    };
  }
  return null;
}

function isDarkColor(colorStr) {
  const c = parseRgba(colorStr);
  if (!c || c.a < 0.2) return false;
  return (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) < 100;
}

function isBlockingFill(colorStr) {
  const c = parseRgba(colorStr);
  if (!c || c.a < 0.25) return false;
  const lum = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  // White panels + dark charcoal panels both hide wallpaper.
  return lum > 210 || lum < 80;
}

function isCssFillImage(bgImg) {
  if (!bgImg || bgImg === 'none') return false;
  return !/url\(/i.test(bgImg);
}

function isProtectedChrome(el) {
  return !!(el.closest?.(PROTECTED_CHROME) || el.matches?.(PROTECTED_CHROME));
}

/** Header / sticky wrappers that must stay opaque and in normal flow. */
function isTopChromeShell(el) {
  if (!el || el === document.body || el === document.documentElement) return false;
  if (isProtectedChrome(el)) return true;
  if (el.id === 'gb' || el.querySelector?.(':scope > #gb, :scope > header#gb, :scope > header[role="banner"]')) {
    return true;
  }
  return false;
}

function isInTemplateSection(el) {
  if (!el) return false;
  return !!el.closest?.(
    '[class*="homescreen-templates"], [class*="templateview"], [class*="TemplateView"]'
  );
}

function forceLegibleText(el) {
  const st = getComputedStyle(el);
  if (isDarkColor(st.color)) el.style.setProperty('color', 'var(--stylus-fg)', 'important');
  if (isDarkColor(st.fill) && st.fill !== 'none') {
    el.style.setProperty('fill', 'var(--stylus-fg)', 'important');
  }
}

function forceLegibleTextIn(root) {
  if (!root) return;
  forceLegibleText(root);
  for (const el of root.querySelectorAll('*')) {
    if (el.matches?.('img, canvas, video, [role="img"]') || isThumbnailCard(el)) continue;
    forceLegibleText(el);
  }
}

function clearBackground(el) {
  if (!el || el === document.documentElement || el === document.body) return;
  if (el.id === WALLPAPER_ID || el.id === VEIL_ID) return;
  if (el.matches?.('img, canvas, video, svg, [role="img"]')) return;
  if (isThumbnailCard(el)) return;
  if (isProtectedChrome(el)) return;
  const bgImg = el.style?.backgroundImage || getComputedStyle(el).backgroundImage;
  if (bgImg && bgImg !== 'none' && /url\(/i.test(bgImg)) return;
  el.style.setProperty('background-color', 'transparent', 'important');
  if (bgImg && bgImg !== 'none') el.style.setProperty('background-image', 'none', 'important');
  forceLegibleText(el);
}

function findTextAnchor(re) {
  const root = document.body;
  if (!root) return null;
  let fallback = null;
  for (const el of root.querySelectorAll('div, span, button, [role="button"], h1, h2, h3, a')) {
    let hit = false;
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE && re.test(node.textContent || '')) {
        hit = true;
        break;
      }
    }
    if (!hit) {
      const t = (el.textContent || '').trim();
      if (t.length < 48 && re.test(t)) hit = true;
    }
    if (!hit) continue;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight) return el;
    if (!fallback) fallback = el;
  }
  return fallback;
}

/**
 * Docs (and #gb) pin the top search chrome with sticky/fixed wrappers.
 * Tag those with a CSS class so they stay in normal flow without inline-style fights.
 */
function unstickTopSearchChrome() {
  const roots = [
    document.getElementById('gb'),
    document.querySelector('header#gb'),
    document.querySelector('header[role="banner"]'),
  ].filter(Boolean);
  if (!roots.length) return;

  const seen = new Set();
  for (const root of roots) {
    let el = root;
    for (let i = 0; i < 12 && el && el !== document.body && el !== document.documentElement; i++) {
      if (!seen.has(el)) {
        seen.add(el);
        const st = getComputedStyle(el);
        const pinned = st.position === 'sticky' || st.position === 'fixed' ||
          el.classList.contains(SCROLL_FLOW_CLASS);
        const r = el.getBoundingClientRect();
        // Only the top chrome strip — don't touch menus / dialogs.
        const topStrip = r.top <= 12 && r.width > window.innerWidth * 0.45 &&
          r.height > 28 && r.height < 160;
        if ((pinned || el === root) && topStrip) {
          el.classList.add(SCROLL_FLOW_CLASS);
        }
      }
      el = el.parentElement;
    }
  }
}

/** Opaque dark bar for the Recent documents toolbar row. */
function markRecentBar() {
  const root = document.body;
  if (!root) return;

  for (const el of root.querySelectorAll(`.${RECENT_BAR_CLASS}`)) {
    if (!OWNED_BY_RE.test(el.textContent || '') && !RECENT_DOCS_RE.test(el.textContent || '')) {
      el.classList.remove(RECENT_BAR_CLASS);
    }
  }

  const anchor = findTextAnchor(OWNED_BY_RE) || findTextAnchor(RECENT_DOCS_RE);
  if (!anchor || isInTemplateSection(anchor)) return;

  let cur = anchor;
  let best = null;
  for (let i = 0; i < 12 && cur && cur !== root; i++) {
    if (isInTemplateSection(cur)) break;
    const r = cur.getBoundingClientRect();
    const text = cur.textContent || '';
    if (
      r.width > 480 && r.height > 28 && r.height < 90 &&
      (OWNED_BY_RE.test(text) || RECENT_DOCS_RE.test(text)) &&
      !TEMPLATE_GALLERY_RE.test(text) &&
      !START_NEW_RE.test(text)
    ) {
      best = cur;
      if (RECENT_DOCS_RE.test(text) && OWNED_BY_RE.test(text)) break;
    }
    cur = cur.parentElement;
  }
  if (!best) return;

  best.classList.add(RECENT_BAR_CLASS);
  best.style.setProperty('background-color', 'var(--stylus-surface)', 'important');
  best.style.setProperty('background-image', 'none', 'important');
  best.style.setProperty('color', 'var(--stylus-fg)', 'important');
  best.style.setProperty('text-shadow', 'none', 'important');
  for (const child of best.querySelectorAll('div, span, button, a, [role="button"]')) {
    child.style.setProperty('text-shadow', 'none', 'important');
    child.style.setProperty('color', 'var(--stylus-fg)', 'important');
  }
  ensureRecentTitleVisible(best);
}

/** Make sure "Recent documents" is visible and not ghosted. */
function ensureRecentTitleVisible(bar) {
  const root = bar || document.body;
  if (!root) return;

  const candidates = [];
  for (const el of root.querySelectorAll('div, span, h1, h2, h3')) {
    const t = (el.textContent || '').trim();
    if (!RECENT_DOCS_RE.test(t) || t.length > 36) continue;
    if ((el.children?.length || 0) > 2) continue;
    candidates.push(el);
  }
  const leaves = candidates.filter(el => !candidates.some(o => o !== el && el.contains(o)));
  if (!leaves.length) return;

  // Restore everything first (previous pass may have zeroed opacity).
  for (const el of leaves) {
    el.style.setProperty('opacity', '1', 'important');
    el.style.setProperty('visibility', 'visible', 'important');
    el.style.setProperty('color', 'var(--stylus-fg)', 'important');
    el.style.setProperty('text-shadow', 'none', 'important');
    el.style.setProperty('pointer-events', 'auto', 'important');
  }
  if (leaves.length < 2) return;

  // Keep the largest visible leaf; hide only clearly overlapping clones.
  const scored = leaves.map(el => {
    const st = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const ariaHidden = el.closest('[aria-hidden="true"]');
    const area = Math.max(0, r.width) * Math.max(0, r.height);
    const score = area * Number(st.opacity || 1) - (ariaHidden ? 1e6 : 0);
    return {el, r, st, score};
  }).sort((a, b) => b.score - a.score);

  const keep = scored[0];
  for (const item of scored.slice(1)) {
    const near = Math.abs(item.r.top - keep.r.top) < 20 &&
      Math.abs(item.r.left - keep.r.left) < 36;
    const abs = item.st.position === 'absolute' || item.st.position === 'fixed';
    const ariaHidden = !!item.el.closest('[aria-hidden="true"]');
    if ((near && (abs || ariaHidden || item.score < keep.score * 0.6)) || ariaHidden) {
      item.el.style.setProperty('opacity', '0', 'important');
      item.el.style.setProperty('pointer-events', 'none', 'important');
    }
  }
}

function killGhostLabels() {
  ensureRecentTitleVisible(document.body);
}

function styleDocCardFooters() {
  const root = document.body;
  if (!root) return;

  for (const preview of root.querySelectorAll('img, canvas, [role="img"]')) {
    if (preview.closest?.(`#${WALLPAPER_ID}, #${VEIL_ID}, #gb`)) continue;
    if (isInTemplateSection(preview)) continue;
    const mr = preview.getBoundingClientRect();
    if (mr.width < 90 || mr.width > 380 || mr.height < 70 || mr.height > 440) continue;
    // Recent docs sit below the template gallery band.
    if (mr.top < 250) continue;

    let card = preview.parentElement;
    let found = null;
    for (let i = 0; i < 8 && card && card !== root; i++) {
      if (isInTemplateSection(card)) break;
      const r = card.getBoundingClientRect();
      if (r.width >= mr.width - 4 && r.width < 420 &&
          r.height > mr.height + 20 && r.height < 560) {
        found = card;
        break;
      }
      card = card.parentElement;
    }
    if (!found) continue;
    found.classList.add(DOC_CARD_CLASS);

    let painted = false;
    for (const child of found.children) {
      if (child === preview || child.contains(preview) || preview.contains?.(child)) continue;
      const cr = child.getBoundingClientRect();
      if (cr.height < 18 || cr.height > 150) continue;
      if (cr.top + 2 < mr.bottom) continue;
      paintFooter(child);
      painted = true;
    }
    if (painted) continue;

    for (const el of found.querySelectorAll('div, span')) {
      if (el.contains(preview) || preview.contains?.(el)) continue;
      if (el.closest(`.${DOC_FOOTER_CLASS}`)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 50 || r.height < 24 || r.height > 110) continue;
      if (r.top + 2 < mr.bottom) continue;
      if (!(el.textContent || '').trim()) continue;
      if (el.querySelector('img, canvas, [role="img"]')) continue;
      paintFooter(el);
    }
  }
}

function paintFooter(el) {
  el.classList.add(DOC_FOOTER_CLASS);
  el.style.setProperty('background-color', '#141416', 'important');
  el.style.setProperty('background-image', 'none', 'important');
  el.style.setProperty('backdrop-filter', 'none', 'important');
  el.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
  el.style.setProperty('filter', 'none', 'important');
  el.style.setProperty('text-shadow', 'none', 'important');
  el.style.setProperty('color', '#fff', 'important');
  for (const child of el.querySelectorAll('*')) {
    if (child.matches?.('img, canvas, video, [role="img"]')) continue;
    child.style.setProperty('color', '#fff', 'important');
    child.style.setProperty('text-shadow', 'none', 'important');
    if (child.matches?.('svg')) {
      child.style.setProperty('fill', '#fff', 'important');
      child.style.setProperty('color', '#fff', 'important');
    }
  }
}

/** Bring back Template gallery / Start a new document after clears. */
function restoreTemplateSection() {
  const root = document.body;
  if (!root) return;

  for (const el of root.querySelectorAll('div, section, header, span, h1, h2, h3, a, button')) {
    let hit = false;
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE &&
          (START_NEW_RE.test(node.textContent) || TEMPLATE_GALLERY_RE.test(node.textContent))) {
        hit = true;
        break;
      }
    }
    const t = (el.textContent || '').trim();
    if (!hit && t.length < 36 && (START_NEW_RE.test(t) || TEMPLATE_GALLERY_RE.test(t))) hit = true;
    if (!hit) continue;

    el.style.setProperty('opacity', '1', 'important');
    el.style.setProperty('visibility', 'visible', 'important');
    el.style.setProperty('color', 'var(--stylus-fg)', 'important');
    el.style.setProperty('text-shadow', 'none', 'important');

    let cur = el;
    let top = el;
    for (let i = 0; i < 8 && cur && cur !== root; i++) {
      cur.style.setProperty('opacity', '1', 'important');
      cur.style.setProperty('visibility', 'visible', 'important');
      if (!isThumbnailCard(cur)) clearBackground(cur);
      forceLegibleText(cur);
      top = cur;
      cur = cur.parentElement;
    }
    forceLegibleTextIn(top);
  }

  for (const el of root.querySelectorAll([
    '[class*="homescreen-templates"] img',
    '[class*="templateview"] img',
    '[class*="TemplateView"] img',
    '[class*="homescreen-templates"] canvas',
    '[class*="templateview"] canvas',
  ].join(', '))) {
    el.style.setProperty('opacity', '1', 'important');
    el.style.setProperty('visibility', 'visible', 'important');
  }
}

function clearBlockingSurfaces() {
  const root = document.body;
  if (!root || scrolling) return;

  for (const el of root.querySelectorAll('div, section, main, header, [role="main"]')) {
    if (el.id === WALLPAPER_ID || el.id === VEIL_ID) continue;
    if (isThumbnailCard(el)) continue;
    if (isTopChromeShell(el)) continue;
    const st = getComputedStyle(el);
    if (st.opacity === '0' || st.visibility === 'hidden') continue;
    // Never punch sticky/fixed top strips — clearing them flashes wallpaper behind chrome.
    if ((st.position === 'sticky' || st.position === 'fixed') &&
        el.getBoundingClientRect().top <= 12) {
      continue;
    }
    const bgImg = st.backgroundImage;
    if (bgImg && bgImg !== 'none' && !isCssFillImage(bgImg)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 160 || r.height < 50) continue;
    if (r.height <= 120 && r.width <= 420 && el.closest?.(`.${DOC_CARD_CLASS}`)) continue;
    const blocked = isBlockingFill(st.backgroundColor) || isCssFillImage(st.backgroundImage);
    if (!blocked) continue;
    el.style.setProperty('background-color', 'transparent', 'important');
    if (isCssFillImage(st.backgroundImage)) {
      el.style.setProperty('background-image', 'none', 'important');
    }
    forceLegibleText(el);
  }
}

function showWallpaper(i) {
  const url = `url("${WALLPAPERS[i]}")`;
  const layer = document.getElementById(WALLPAPER_ID);
  const veil = document.getElementById(VEIL_ID);
  if (layer) {
    layer.style.setProperty('background-image', url, 'important');
    layer.style.setProperty('opacity', '1', 'important');
    layer.style.setProperty('visibility', 'visible', 'important');
  }
  if (veil) {
    veil.style.setProperty('background-image', url, 'important');
    veil.style.setProperty('opacity', '1', 'important');
    veil.style.setProperty('visibility', 'visible', 'important');
  }
}

function tick() {
  ensureLayers();
  currentIndex = (currentIndex + 1) % WALLPAPERS.length;
  showWallpaper(currentIndex);
}

let applying = false;

function refreshUi({heavy = true} = {}) {
  if (scrolling && heavy) return;
  applying = true;
  try {
    ensureLayers();
    unstickTopSearchChrome();
    if (heavy) {
      clearBlockingSurfaces();
      restoreTemplateSection();
      markRecentBar();
      styleDocCardFooters();
      killGhostLabels();
    }
  } finally {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        applying = false;
      });
    });
  }
}

function keepWallpaperVisible() {
  if (applying || scrolling) return;
  refreshUi({heavy: false});
}

function onScrollActivity() {
  scrolling = true;
  if (scrollIdleTimer) clearTimeout(scrollIdleTimer);
  scrollIdleTimer = setTimeout(() => {
    scrolling = false;
    refreshUi({heavy: true});
  }, 180);
}

function start() {
  ensureStyle();
  ensureLayers();
  if (!document.body) {
    document.addEventListener('DOMContentLoaded', ensureLayers, {once: true});
  }
  showWallpaper(currentIndex);
  setInterval(tick, INTERVAL_MS);
  for (const url of WALLPAPERS) {
    const img = new Image();
    img.src = url;
  }

  window.addEventListener('scroll', onScrollActivity, {passive: true, capture: true});
  document.addEventListener('scroll', onScrollActivity, {passive: true, capture: true});

  let scheduled = 0;
  const scheduleClear = () => {
    if (applying || scrolling || scheduled) return;
    scheduled = setTimeout(() => {
      scheduled = 0;
      refreshUi({heavy: true});
    }, 200);
  };
  refreshUi({heavy: true});
  new MutationObserver(mutations => {
    for (const m of mutations) {
      const t = m.target;
      if (t === document.getElementById(STYLE_ID)) continue;
      if (t?.id === WALLPAPER_ID || t?.id === VEIL_ID) continue;
      if (t?.classList?.contains(DOC_FOOTER_CLASS) ||
          t?.classList?.contains(RECENT_BAR_CLASS) ||
          t?.classList?.contains(SCROLL_FLOW_CLASS)) {
        continue;
      }
      // Ignore pure style thrash during scroll/layout — it caused wallpaper flashes.
      if (m.type === 'attributes' && m.attributeName === 'style') continue;
      scheduleClear();
      return;
    }
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class'],
  });
  // Light keep-alive only — never re-punch backgrounds in a tight loop.
  const keepAlive = setInterval(keepWallpaperVisible, 1000);
  setTimeout(() => clearInterval(keepAlive), 8_000);
  for (const delay of [400, 1200, 3000]) {
    setTimeout(() => refreshUi({heavy: true}), delay);
  }
}

start();
