/**
 * layout.js — padding, margin, gap, border-radius, box-shadow frequency across rendered elements
 *
 * Output: {
 *   padding: [{ value, count }],
 *   margin:  [{ value, count }],
 *   gap:     [{ value, count }],
 *   radius:  [{ value, count }],
 *   shadow:  [{ value, count }],
 *   border:  [{ value, count }],
 *   scale:   { spacing: [sorted unique px values], radius: [...] }
 * }
 */
(() => {
  const tally = (map, key) => {
    if (!key || key === '0px' || key === 'none' || key === 'auto') return;
    map.set(key, (map.get(key) || 0) + 1);
  };

  const sides = ['top', 'right', 'bottom', 'left'];
  const padding = new Map();
  const margin = new Map();
  const gap = new Map();
  const radius = new Map();
  const shadow = new Map();
  const border = new Map();

  let sampled = 0;
  for (const el of document.querySelectorAll('body *')) {
    if (sampled++ >= 5000) break;
    if (!el.getClientRects().length) continue;
    const cs = getComputedStyle(el);
    for (const s of sides) {
      tally(padding, cs.getPropertyValue(`padding-${s}`));
      tally(margin, cs.getPropertyValue(`margin-${s}`));
    }
    for (const corner of ['top-left', 'top-right', 'bottom-right', 'bottom-left']) {
      tally(radius, cs.getPropertyValue(`border-${corner}-radius`));
    }
    tally(gap, cs.rowGap);
    tally(gap, cs.columnGap);
    tally(shadow, cs.boxShadow);
    tally(border, cs.borderTopWidth + ' ' + cs.borderTopStyle + ' ' + cs.borderTopColor);
  }

  const toList = (map) => Array.from(map.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);

  // Infer scales by extracting numeric px from top values
  const numericScale = (map) => {
    const nums = new Set();
    for (const k of map.keys()) {
      const m = k.match(/^([\d.]+)px$/);
      if (m) nums.add(parseFloat(m[1]));
    }
    return Array.from(nums).sort((a, b) => a - b);
  };

  return {
    padding: toList(padding),
    margin: toList(margin),
    gap: toList(gap),
    radius: toList(radius),
    shadow: toList(shadow),
    border: toList(border),
    scales: {
      padding: numericScale(padding),
      margin: numericScale(margin),
      radius: numericScale(radius),
      gap: numericScale(gap),
    },
  };
})();
