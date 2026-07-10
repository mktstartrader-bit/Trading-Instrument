# STARTRADER — Trading Instruments

A modern, glassmorphic **financial instruments explorer** for STARTRADER, built in
plain HTML/CSS/JS (no framework, no build step).

## Features

- **Instrument Explorer table** — 600+ instruments across Forex, Metals, Commodities,
  Indices, Shares, Crypto and ETFs, deduplicated from the real symbol universe.
- **Live search, category filters and sorting** (Gainers / Losers / A–Z), paginated
  10 rows at a time.
- **Detail page** for every instrument (`instrument.html?symbol=<id>`) with an animated
  chart, live Buy/Sell quote, a blue-gradient key-info banner (Symbol · Leverage ·
  Margin · Trading Hours), contract specs, available symbol variants and related markets.
- **Glassmorphic light UI** on a blue ambient background, a blue-gradient hero banner,
  real STARTRADER navbar + footer, and the official logo.
- Brand system: STARTRADER navy `#0D0D4B` / blue `#0047BB`, **Plus Jakarta Sans**.

## Data

`js/symbol_all.js` holds the raw tradable symbols. `js/data.js` transforms them into
clean instruments with asset-appropriate demo pricing (FX shown as true cross-rates).
Prices/changes are seeded placeholders — swap the pricing block in `js/data.js` for a
live market feed. Drop in an updated `symbol_all.js` and the whole UI rebuilds.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000/index.html
```

## Structure

```
index.html            # instrument explorer
instrument.html       # instrument detail page
css/styles.css        # design system
js/symbol_all.js      # raw symbol universe
js/data.js            # builds instruments + categories
js/app.js             # table rendering, search, filters, live prices
js/detail.js          # detail page rendering
js/chrome.js          # shared navbar + footer
assets/               # logo (light + white variants)
```
