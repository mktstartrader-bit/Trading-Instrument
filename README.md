# STARTRADER — Trading Instruments

A modern, glassmorphic **financial instruments explorer** for STARTRADER, built in
plain HTML/CSS/JS (no framework, no build step).

## Features

- **Instrument explorer table** — the 55 instruments of the approved page list
  (Forex 10 · Commodities 10 · Indices 10 · Metals 5 · Shares 10 · ETFs 10), one row
  per page, with each instrument's account/feed variants surfaced on its detail page.
  Columns: Instrument · Sell · Buy · Spread · Change · 7-Day Trend · Trade.
- **English / Polish language switch** in the navbar — see [Languages](#languages).
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

`js/data.js` holds `CATALOGUE` — the 55 symbols of the approved page list, one per
category — and transforms them into clean instruments with asset-appropriate demo
pricing (FX shown as true cross-rates). Every symbol is offered on three account
types / data feeds (`X.c`, `X+`, `X`), listed on its detail page. `MOST_TRADED_TOP`
is the curated cross-asset "Most Traded" ranking shown on the default tab.
Prices/changes are seeded placeholders — swap the pricing block in `js/data.js` for a
live market feed. (`js/symbol_all.js` retains the full raw symbol universe for
reference but is no longer loaded by the pages.)

**`CATALOGUE` symbols must stay in sync with `js/content-pl.js`** — its keys are
`slug(symbol)`, so renaming or adding a symbol without a matching workbook sheet
leaves that page without Polish copy.

## Languages

The navbar carries an **EN / PL** switch. The choice is read from `?lang=pl` first,
then `localStorage`, defaulting to English; it is persisted and appended to internal
links so a shared URL keeps its language.

All Polish copy is **generated, never authored in code**. `js/content-pl.js` is built
from the approved workbook by:

```bash
python3 tools/build-pl-content.py ~/Downloads/"Trading Instrument-PL Content (1).xlsx"
```

The generator reads the **Final PL** column of every sheet verbatim (falling back to
that row's *PL draft* only where Final PL is blank), plus the `Page Index` sheet for
each page's PL `<title>` and meta description. Re-run it whenever the workbook changes.

Strings the workbook does not cover are **left in English on purpose** rather than
machine-translated: the navbar and footer, the risk warning, `Show N more` /
`Showing all N` / the empty-search state, and the detail-page labels *Trading Symbol,
Leverage, Margin, Trading Hours (GMT), Day Range, 52-Week Range, Change %* and the
related-table *Price* header. Add them to the workbook and re-run the generator to
localise them.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000/index.html
```

## Structure

```
index.html                  # most-traded instrument explorer
instrument.html             # instrument detail page
css/styles.css              # design system
js/data.js                  # CATALOGUE (55 symbols) -> builds instruments + categories
js/content-pl.js            # GENERATED — Polish copy, verbatim from the workbook
js/i18n.js                  # EN/PL selection, language button, metadata
js/app.js                   # table rendering, search, filters, live prices
js/detail.js                # detail page rendering
js/chrome.js                # shared navbar + footer
js/symbol_all.js            # full raw symbol universe (reference only, not loaded)
tools/build-pl-content.py   # workbook -> js/content-pl.js
assets/                     # logo (light + white variants)
```
