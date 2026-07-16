# STARTRADER — Trading Instruments

A modern, glassmorphic **financial instruments explorer** for STARTRADER, built in
plain HTML/CSS/JS (no framework, no build step).

## Features

- **Instrument explorer table** — 55 instruments across six asset classes
  (Forex 10 · Commodities 10 · Indices 10 · Metals 5 · Shares 10 · ETFs 10),
  deduplicated so each instrument shows as a single card regardless of its
  account/feed variants. Columns: Instrument · Sell · Buy · Spread · Change ·
  7-Day Trend · Trade.
- **Live search and category filters** — a curated cross-asset **Most Traded** top-10
  default plus one tab per class. Searching widens to the full universe from any tab;
  categories paginate 10 rows at a time.
- **Detail page** for every instrument (`instrument.html?symbol=<id>`) with a
  **candlestick / line chart switch** (OHLC candles, dated x-axis, price axis, hover
  tooltip), live Buy/Sell quote, a blue-gradient key-info banner (Symbol · Leverage ·
  Margin · Trading Hours), available symbol variants and related markets.
- **Glassmorphic light UI** on a blue ambient background, a blue-gradient hero banner,
  real STARTRADER navbar + footer, and the official logo.
- Brand system: STARTRADER navy `#0D0D4B` / blue `#0047BB`, **Plus Jakarta Sans**.

## Data

`js/data.js` holds the `MOST_TRADED` symbol lists — enough symbols per category to
yield, after variant dedup, Forex 10 · Commodities 10 · Indices 10 · Metals 5 ·
Shares 10 · ETFs 10 (= 55) — and transforms them into clean instruments with
asset-appropriate demo pricing (FX shown as true cross-rates). `MOST_TRADED_TOP` is
the curated cross-asset "Most Traded" ranking shown on the default tab. Feed/account
variants (`.c`, `+`, `.z`, `.m`, `.24H`, `ft`, …) are collapsed to one card, with the
full variant set surfaced on the detail page. Prices/changes are seeded placeholders —
swap the pricing block in `js/data.js` for a live market feed. Edit `MOST_TRADED` /
`MOST_TRADED_TOP` and the whole UI rebuilds. (`js/symbol_all.js` retains the full raw
symbol universe for reference but is no longer loaded by the pages.)

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
