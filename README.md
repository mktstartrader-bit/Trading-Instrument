# STARTRADER — Trading Instruments

A modern, glassmorphic **financial instruments explorer** for STARTRADER, built in
plain HTML/CSS/JS (no framework, no build step).

## Features

- **Most Traded explorer table** — the top-10 most-traded instruments per category
  (Forex, Commodities, Indices, Metals, Shares and ETFs), deduplicated so each
  instrument shows as a single card regardless of its account/feed variants.
- **Live search and category filters** ("Most Traded" default + one tab per category),
  paginated 10 rows at a time.
- **Detail page** for every instrument (`instrument.html?symbol=<id>`) with an animated
  chart, live Buy/Sell quote, a blue-gradient key-info banner (Symbol · Leverage ·
  Margin · Trading Hours), contract specs, available symbol variants and related markets.
- **Glassmorphic light UI** on a blue ambient background, a blue-gradient hero banner,
  real STARTRADER navbar + footer, and the official logo.
- Brand system: STARTRADER navy `#0D0D4B` / blue `#0047BB`, **Plus Jakarta Sans**.

## Data

`js/data.js` holds the curated `MOST_TRADED` list — the top-10 symbols per category
(order = ranking) — and transforms them into clean instruments with asset-appropriate
demo pricing (FX shown as true cross-rates). Feed/account variants (`.c`, `+`, `.z`,
`.m`, `.24H`, `ft`, …) are collapsed to one card, with the full variant set surfaced on
the detail page. Prices/changes are seeded placeholders — swap the pricing block in
`js/data.js` for a live market feed. Edit `MOST_TRADED` to change which instruments
appear and the whole UI rebuilds. (`js/symbol_all.js` retains the full raw symbol
universe for reference but is no longer loaded by the pages.)

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000/index.html
```

## Structure

```
index.html            # most-traded instrument explorer
instrument.html       # instrument detail page
css/styles.css        # design system
js/data.js            # curated MOST_TRADED list -> builds instruments + categories
js/app.js             # table rendering, search, filters, live prices
js/detail.js          # detail page rendering
js/chrome.js          # shared navbar + footer
js/symbol_all.js      # full raw symbol universe (reference only, not loaded)
assets/               # logo (light + white variants)
```
