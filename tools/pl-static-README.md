# STARTRADER Trading Instruments — Polish (PL) pages

56 static pages: the PL instruments home and 55 instrument pages. They're laid out to
match the production URLs from the approved workbook's Page Index.

```
pl/trading-instruments/index.html                    -> startrader.com/pl/trading-instruments/
pl/trading-instruments/<category>/<id>/index.html    -> startrader.com/pl/trading-instruments/<category>/<id>/
pl/trading-instruments/instrument.html               -> forwards TradingView table clicks to the right page (noindex)
pl/trading-instruments/pages.csv                     -> id, file, live URL and title of all 56 pages
pl/trading-instruments/{css,js,assets}               -> shared files (all paths are relative)
```

## What's in each page
- Polish only: `<html lang="pl">`, the workbook's PL `<title>` and meta description,
  a canonical URL and `hreflang` links (pl + en).
- Polish copy comes verbatim from the approved workbooks. The 30 pages that have a
  long-form PL article load it from `js/pl-additional/<id>.js`; the other 25 don't
  have one in the workbook yet.
- **Live market data from TradingView** (Polish-language widgets):
  - Home: a live ticker in the hero, plus a live Market Data table with all 55
    instruments in tabs per asset class. Clicking a row opens our instrument page.
  - Instrument pages: a live TradingView chart and a live quote.
  - The symbol each instrument uses is set in `js/tv.js`. These are TradingView's
    market prices, not STARTRADER's own quotes, and US shares/ETFs may be delayed.
- **No spread or bid/ask figures** anywhere.
- Lighthouse (mobile): performance 97–98, CLS ≤ 0.06. The widgets load after the page,
  so they don't slow the first paint.

## Deploying
Upload `pl/` to the web root so the folders become the URLs above. Each page links
to the others with relative paths, so the bundle also works under any other base path.

## Points to confirm
- The **EN** button and the `hreflang="en"` link point to the same path without `/pl`
  (e.g. `startrader.com/trading-instruments/forex/eurusd/`). Change `--origin` or the
  EN rule in `tools/build-pl-static.py` if the English URLs are different.
- The navbar and footer links are `#` placeholders, the same as on the current site.
- On TradingView, `DRAM` is listed as "Roundhill Memory ETF", while our catalogue says
  "Themes DRAM Semiconductor ETF". Please check that it's the same product.

## Rebuilding
Source: github.com/mktstartrader-bit/Trading-Instrument.
```
python3 tools/build-pl-content.py <workbook>      # only if the PL copy changed
python3 tools/build-pl-additional.py <workbook>   # only if the long-form copy changed
python3 tools/build-pl-static.py                  # writes dist-pl/
```
