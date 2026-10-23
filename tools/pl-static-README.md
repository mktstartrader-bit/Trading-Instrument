# STARTRADER Trading Instruments — Polish (PL) pages

56 static pages: the PL instruments home and 55 instrument pages. They're laid out to
match the production URLs from the approved workbook's Page Index.

```
pl/trading-instruments/index.html                    -> startrader.com/pl/trading-instruments/
pl/trading-instruments/<category>/<id>/index.html    -> startrader.com/pl/trading-instruments/<category>/<id>/
pl/trading-instruments/instrument.html               -> forwards old ?symbol=<id> links to the right page (noindex)
pl/trading-instruments/pages.csv                     -> id, file, live URL and title of all 56 pages
pl/trading-instruments/{css,js,assets}               -> shared files (all paths are relative)
```

## What's in each page
- Polish only: `<html lang="pl">`, the workbook's PL `<title>` and meta description,
  a canonical URL and `hreflang` links (pl + en).
- Polish copy comes verbatim from the approved workbooks. The 30 pages that have a
  long-form PL article load it from `js/pl-additional/<id>.js`; the other 25 don't
  have one in the workbook yet.
- **Market data is plain HTML (no TradingView, no iframes)** — `js/market.js` renders:
  - Home: a ticker tape in the hero, plus a market table (Nazwa, Wartość, Zmiana,
    Zmiana%, Otwarcie, Wysoki, Niski, Poprz.). The category chips above it
    (Najchętniej handlowane, Forex, Surowce, Indeksy, Metale, Akcje, ETF) choose which
    asset class it lists. Clicking a row opens our instrument page.
  - Instrument pages: a quote card and a candlestick / line chart (SVG) with
    1m · 30m · 1h · 1D · 1W intervals and volume.
  - **All figures are placeholder data for now.** To connect the price API, replace the
    two functions in `MarketData` at the top of `js/market.js`:
    `quotes(ids)` and `candles(id, interval)`; both return Promises, and the expected
    fields are documented there. `MarketView.update(id, quote)` pushes live updates
    into every block already on the page (cells carry `data-mk-id` / `data-mk`).
- **No spreads anywhere:** no spread or bid/ask figures and no spread wording
  (`tools/strip-spread.py` cuts it from the workbook copy and fails if any is left).
- **Speed (Core Web Vitals):**
  - Every page ships pre-rendered: header, content and footer are already in the HTML,
    so the page shows as soon as the HTML and CSS arrive. The scripts then run and
    redraw the same markup (entry animations are off on these pages, so it's invisible).
  - Each page loads only its own Polish copy (`js/content-pl/<id>.js`, about 13 KB)
    instead of all 56 pages' copy (117 KB).
  - Both font files are preloaded (Polish letters are in the latin-ext file), so text
    doesn't reflow when the fonts arrive.
  - Lighthouse, mobile: performance 98–100, LCP 1.5–2.2 s, Speed Index 0.8–1.0 s,
    TBT 0 ms, CLS ≤ 0.064. Desktop: 100 on every page tested.

## Rebuilding
```
python3 tools/strip-spread.py                      # removes spread wording copied from the workbooks
python3 tools/build-pl-static.py --out dist-pl     # writes the 56 pages
node tools/prerender-pl.js dist-pl                 # pre-renders them (needs puppeteer-core + Chrome)
```

## Deploying
Upload `pl/` to the web root so the folders become the URLs above. Each page links
to the others with relative paths, so the bundle also works under any other base path,
and opened straight from disk (links name `index.html` there).
Serve it with gzip or brotli compression (any CDN does this by default).

## Points to confirm
- The **EN** button and the `hreflang="en"` link point to the same path without `/pl`
  (e.g. `startrader.com/trading-instruments/forex/eurusd/`). Change `--origin` or the
  EN rule in `tools/build-pl-static.py` if the English URLs are different.
- The navbar and footer links are `#` placeholders, the same as on the current site.
