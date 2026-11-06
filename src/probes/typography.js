/**
 * typography.js — extract font stacks, sizes, weights, line-heights, letter-spacing
 *
 */
(() => {
  const tally = (map, value) => map.set(value, (map.get(value) || 0) + 1);

  const stacks = new Map();
  const sizes = new Map();
  const weights = new Map();
  const lineHeights = new Map();
  const letterSpacing = new Map();

  const textElements = document.querySelectorAll('body *');
  let sampled = 0;
  for (const el of textElements) {
    if (sampled++ >= 5000) break;
    if (!el.getClientRects().length) continue;
    const txt = (el.childNodes && Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim()));
    if (!txt) continue;
    const cs = getComputedStyle(el);
    tally(stacks, cs.fontFamily);
    tally(sizes, cs.fontSize);
    tally(weights, cs.fontWeight);
    tally(lineHeights, cs.lineHeight);
    tally(letterSpacing, cs.letterSpacing);
  }

  // Heading snapshot
  const headings = {};
  for (const tag of ['h1', 'h2', 'h3', 'h4', 'p', 'a', 'button']) {
    const el = document.querySelector(tag);
    if (!el?.getClientRects().length) continue;
    const cs = getComputedStyle(el);
    headings[tag] = {
      fontFamily: cs.fontFamily,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      lineHeight: cs.lineHeight,
      letterSpacing: cs.letterSpacing,
      textTransform: cs.textTransform,
      color: cs.color,
    };
  }

  const sortByCount = (map) => Array.from(map, ([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);

  return {
    stacks: sortByCount(stacks),
    sizes: sortByCount(sizes),
    weights: sortByCount(weights),
    lineHeights: sortByCount(lineHeights),
    letterSpacing: sortByCount(letterSpacing),
    headings,
  };
})();
