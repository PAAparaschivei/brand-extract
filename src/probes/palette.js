/**
 * palette.js — extract every color used in computed styles, with frequency and context
 *
 * Walks all rendered elements, records color / background-color / border-color /
 * fill / stroke / box-shadow color components, tags by usage context.
 *
 * Output: [{ color, hex, rgb, count, contexts: {fg, bg, border, shadow, svg} }]
 */
(() => {
  const PROPS = [
    ['color', 'fg'],
    ['background-color', 'bg'],
    ['border-top-color', 'border'],
    ['border-right-color', 'border'],
    ['border-bottom-color', 'border'],
    ['border-left-color', 'border'],
    ['outline-color', 'border'],
    ['fill', 'svg'],
    ['stroke', 'svg'],
  ];

  const map = new Map();

  const ignore = (v) => !v || v === 'rgba(0, 0, 0, 0)' || v === 'transparent' || v === 'currentcolor' || v === 'none' || v.includes('url(');

  const rgbaToHex = (rgba) => {
    const m = rgba.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const parts = m[1].split(',').map(s => parseFloat(s.trim()));
    const [r, g, b, a = 1] = parts;
    const hex = '#' + [r, g, b].map(n => Math.round(n).toString(16).padStart(2, '0')).join('');
    return a < 1 ? `${hex} @ ${a}` : hex;
  };

  const record = (value, context) => {
    if (ignore(value)) return;
    if (!map.has(value)) map.set(value, { color: value, hex: rgbaToHex(value), count: 0, contexts: {} });
    const entry = map.get(value);
    entry.count++;
    entry.contexts[context] = (entry.contexts[context] || 0) + 1;
  };

  // Parse box-shadow for inline color tokens using matchAll (no .exec)
  const shadowColor = (shadow) => {
    if (!shadow || shadow === 'none') return [];
    const re = /rgba?\([^)]+\)|#[0-9a-f]{3,8}/gi;
    return Array.from(shadow.matchAll(re)).map(m => m[0]);
  };

  const elements = document.querySelectorAll('*');
  let sampled = 0;
  const MAX = 5000;
  for (const el of elements) {
    if (sampled++ >= MAX) break;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || !el.getClientRects().length) continue;
    for (const [prop, ctx] of PROPS) {
      if (ctx === 'svg' && el.namespaceURI !== 'http://www.w3.org/2000/svg') continue;
      if (ctx === 'border' && cs.getPropertyValue(prop.replace('-color', '-style')) === 'none') continue;
      record(cs.getPropertyValue(prop).trim(), ctx);
    }
    for (const c of shadowColor(cs.getPropertyValue('box-shadow'))) {
      record(c, 'shadow');
    }
  }

  const palette = Array.from(map.values()).sort((a, b) => b.count - a.count);

  return palette;
})();
