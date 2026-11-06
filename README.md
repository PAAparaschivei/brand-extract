# Brand Extract

[![CI](https://github.com/PAAparaschivei/brand-extract/actions/workflows/ci.yml/badge.svg)](https://github.com/PAAparaschivei/brand-extract/actions/workflows/ci.yml)

Brand Extract opens a web page in headless Chromium and measures its colors, typography and spacing. The result is a JSON report you can use for a design audit or as input to your own tooling.

## Run it

Requires Node.js 22 or later and npm. On Linux, use `npx playwright install --with-deps chromium` in the installation step.

```sh
git clone https://github.com/PAAparaschivei/brand-extract.git
cd brand-extract
npm ci
npx playwright install chromium
npm run extract -- --url https://example.com --out out/brand.json
```

The default theme is light. Add `--theme dark` to request the browser's dark color scheme. Choose a fresh output path for each run. The command refuses to overwrite a file.

## Read the report

| Field | What it measures |
| --- | --- |
| `colors` | Computed CSS colors counted by use, such as foreground, background and border |
| `typography` | Font stacks, sizes, weights, line heights and a sample of headings and controls |
| `layout` | Padding, margin, gaps, corner radii, shadows and borders |
| `source` | Final page URL without query or fragment, requested theme and viewport |

For example, the included fictional site produces measurements like these:

```json
{
  "color": "#23614e",
  "heading": { "fontFamily": "Georgia, serif", "fontSize": "48px" },
  "gapPx": 12,
  "cornerRadiiPx": [8, 16]
}
```

That excerpt condenses values from the report. Counts describe occurrences in the sampled DOM, including inherited styles. Inspect the report alongside the page before treating a frequent value as a brand token. The CLI samples one desktop viewport and caps its probes at roughly 5,000 elements. It measures the initial page load and uses the site's response to `prefers-color-scheme`.

## Data and permissions

Chromium starts with a fresh profile and makes the requests required to load the target page and its resources. The report is written locally. It contains observed style values and omits page copy, screenshots, request logs, font files and logos. Run it on sites you trust and have permission to inspect. Site assets remain subject to their owners' terms.

## Development

Run `npm test` after installing Chromium. The tests serve the [fictional example](examples/site.html) on loopback and verify the measurements through the CLI. Open a GitHub issue with the command and a public URL or synthetic reproduction.

[Apache License 2.0](LICENSE).
