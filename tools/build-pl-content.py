#!/usr/bin/env python3
"""
Generate js/content-pl.js from the approved translation workbook.

Source of truth: "Trading Instrument-PL Content (1).xlsx"
  * Page Index                -> URL slug, PL <title> and meta description per page
  * "Trading Instrument page" -> explorer/home copy (EN column + Final PL column)
  * one sheet per instrument  -> 33 ordered content rows (Final PL column)

Every string is copied verbatim. The only edits made here are structural, not
editorial: workbook annotations that describe the layout rather than being page
copy ("(tabela)", "[dane na żywo — bez tłumaczenia]") are dropped, and rows that
pack two fields into one cell ("Sprzedaż | Kupno") are split on their separator.

If a sheet leaves "Final PL" blank for a row, the "PL draft" value for that same
row is used — otherwise the page would render an empty string. Sheets where this
happened are printed at the end of a run.

Usage:  python3 tools/build-pl-content.py [path/to/workbook.xlsx]
"""

import json
import os
import re
import sys

import openpyxl

DEFAULT_XLSX = os.path.expanduser(
    "~/Downloads/Trading Instrument-PL Content (1).xlsx"
)
OUT = os.path.join(os.path.dirname(__file__), "..", "js", "content-pl.js")

# Page Index "Category" -> app category id
CAT_ID = {
    "Forex": "forex",
    "Commodities": "commodities",
    "Indices": "indices",
    "Metals": "metals",
    "Share CFDs": "shares",
    "ETF": "etf",
}

# The 33 content rows of every instrument sheet, in workbook order.
FIELDS = [
    "crumb",        # 0  Instrumenty › Forex › EUR/USD
    "badge",        # 1  EUR
    "sym",          # 2  EUR/USD                     (page H1)
    "name",         # 3  Euro/Dolar amerykański
    "cat",          # 4  FOREX                       (category pill)
    "chartLine",    # 5  Liniowy
    "chartCandle",  # 6  Świecowy
    "timeframes",   # 7  1 minuta, 5 minut, …
    "quoteHead",    # 8  NOTOWANIE NA ŻYWO
    "_sellbuy",     # 9  Sprzedaż | Kupno            (split below)
    "tradeSym",     # 10 EUR/USD                     (trading symbol)
    "levPrefix",    # 11 Do                          (leverage prefix)
    "marginPrefix", # 12 od                          (margin prefix)
    "aboutHead",    # 13 O instrumencie EUR/USD
    "aboutName",    # 14 Euro/Dolar amerykański
    "about",        # 15 <paragraph>
    "whyHead",      # 16 DLACZEGO WARTO HANDLOWAĆ …
    "_why1", "_why2", "_why3", "_why4",              # 17-20
    "driversHead",  # 21 KLUCZOWE CZYNNIKI RYNKOWE
    "_drv1", "_drv2", "_drv3", "_drv4",              # 22-25
    "symbolsHead",  # 26 Dostępne symbole
    "symbolsIntro", # 27 Ten sam instrument dostępny jest na 3 typach kont …
    "_var1", "_var2", "_var3",                       # 28-30
    "relatedHead",  # 31 POWIĄZANE W KATEGORII FOREX (tabela)
    "back",         # 32 ← Powrót do wszystkich instrumentów
]

ANNOTATIONS = [
    re.compile(r"\s*\(tabela\)\s*$", re.I),
    re.compile(r"\s*\(table\)\s*$", re.I),
    re.compile(r"\s*\[[^\]]*\]\s*$"),
]


def clean(v):
    return "" if v is None else str(v).strip()


def strip_annotation(s):
    for rx in ANNOTATIONS:
        s = rx.sub("", s)
    return s.strip()


def slug(s):
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", str(s).lower()))


def col_index(ws, header):
    """1-based index of a header cell in row 1, or None."""
    for c in range(1, 6):
        if clean(ws.cell(row=1, column=c).value) == header:
            return c
    return None


def read_final(ws, rows):
    """Final PL column for `rows` data rows, falling back per row to PL draft."""
    fi = col_index(ws, "Final PL") or 2
    di = col_index(ws, "PL draft") or 1
    out, fallbacks = [], 0
    for r in range(2, 2 + rows):
        final = clean(ws.cell(row=r, column=fi).value)
        draft = clean(ws.cell(row=r, column=di).value)
        if not final and draft:
            final = draft
            fallbacks += 1
        out.append(final)
    return out, fallbacks


def split_pair(s):
    parts = [p.strip() for p in s.split("|")]
    return (parts + parts)[:2] if parts else ["", ""]


def split_variant(s):
    """'EURUSD.c — konto centowe' -> ('EURUSD.c', 'konto centowe')"""
    for sep in (" — ", " – ", " - "):
        if sep in s:
            a, b = s.split(sep, 1)
            return [a.strip(), b.strip()]
    return [s, ""]


def hero_meta(s):
    """'55 instrumentów · 6 klas aktywów · Egzekucja < 30 ms' -> the 3 labels.

    The two counts are animated at runtime, so only the wording after each
    number is kept; the third segment is used whole.
    """
    segs = [p.strip() for p in re.split(r"[·|]", s) if p.strip()]
    while len(segs) < 3:
        segs.append("")
    strip_num = lambda t: re.sub(r"^\d[\d,\s]*", "", t).strip()
    return [strip_num(segs[0]), strip_num(segs[1]), segs[2]]


def explorer_sub(s):
    """'55 instrumentów · wybierz…' -> ' instrumentów · wybierz…' (count is live)."""
    return re.sub(r"^\s*\d[\d,\s]*", "", s)


def hero_title(s):
    """Keep the string intact; mark the clause after ' - ' for the accent span."""
    m = re.split(r"\s+[-–—]\s+", s, maxsplit=1)
    return [m[0], m[1]] if len(m) == 2 else [s, ""]


def main():
    xlsx = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_XLSX
    wb = openpyxl.load_workbook(xlsx, data_only=True)

    # ---- Page Index: slugs + SEO metadata -------------------------------
    idx = wb["Page Index"]
    meta, order, page_cat = {}, [], {}
    for r in range(2, idx.max_row + 1):
        name = clean(idx.cell(row=r, column=1).value)
        if not name:
            continue
        category = clean(idx.cell(row=r, column=2).value)
        symbol = clean(idx.cell(row=r, column=3).value)
        url = clean(idx.cell(row=r, column=6).value)
        key = "home" if category == "Main page" else slug(symbol or name)
        meta[key] = {
            "title": clean(idx.cell(row=r, column=8).value),
            "description": clean(idx.cell(row=r, column=9).value),
            "url": url,
        }
        if key != "home":
            # a few Page Index rows label the page differently from the tab that
            # carries its copy (e.g. "XAU/AUD" vs the "XAUAUD" sheet)
            sheet = name if name in wb.sheetnames else symbol
            order.append((sheet, key))
            page_cat[key] = CAT_ID.get(category, slug(category))

    # ---- Home / explorer copy -------------------------------------------
    home = wb["Trading Instrument page"]
    pl, fb_home = read_final(home, 10)
    en = [clean(home.cell(row=r, column=1).value) for r in range(2, 12)]

    def ui(src):
        title = hero_title(src[0])
        return {
            "heroTitleLead": title[0],
            "heroTitleAccent": title[1],
            "heroSub": src[1],
            "heroMeta": hero_meta(src[2]),
            "explorerTitle": src[5],
            "explorerSub": explorer_sub(src[6]),
            "searchPlaceholder": src[7],
            # "Forex (10)" -> "Forex"; the explorer renders its own live count
            "chips": [re.sub(r"\s*\(\d+\)\s*$", "", p.strip()) for p in src[8].split("|")],
            "columns": [p.strip() for p in src[9].split("|")],
        }

    out = {
        "ui": {"pl": ui(pl), "en": ui(en)},
        "meta": meta,
        "order": [k for _, k in order],
        "cat": page_cat,
        "instruments": {},
    }

    # ---- One block per instrument ---------------------------------------
    fallbacks, missing = {}, []
    for sheet_name, key in order:
        if sheet_name not in wb.sheetnames:
            missing.append(sheet_name)
            continue
        rows, fb = read_final(wb[sheet_name], len(FIELDS))
        if fb:
            fallbacks[sheet_name] = fb
        v = dict(zip(FIELDS, rows))
        sell, buy = split_pair(v["_sellbuy"])
        out["instruments"][key] = {
            "crumb": [p.strip() for p in v["crumb"].split("›")],
            "badge": v["badge"],
            "sym": v["sym"],
            "name": v["name"],
            "cat": v["cat"],
            "chartLine": v["chartLine"],
            "chartCandle": v["chartCandle"],
            "quoteHead": v["quoteHead"],
            "sell": sell,
            "buy": buy,
            "tradeSym": v["tradeSym"],
            "levPrefix": v["levPrefix"],
            "marginPrefix": v["marginPrefix"],
            "aboutHead": v["aboutHead"],
            "aboutName": v["aboutName"],
            "about": v["about"],
            "whyHead": v["whyHead"],
            "why": [v["_why1"], v["_why2"], v["_why3"], v["_why4"]],
            "driversHead": v["driversHead"],
            "drivers": [v["_drv1"], v["_drv2"], v["_drv3"], v["_drv4"]],
            "symbolsHead": v["symbolsHead"],
            "symbolsIntro": v["symbolsIntro"],
            "variants": [split_variant(v[k]) for k in ("_var1", "_var2", "_var3")],
            "relatedHead": strip_annotation(v["relatedHead"]),
            "back": v["back"],
        }

    body = json.dumps(out, ensure_ascii=False, indent=2, sort_keys=False)
    header = (
        "/* ============================================================\n"
        "   AUTO-GENERATED — do not edit by hand.\n"
        "   Source: Trading Instrument-PL Content (1).xlsx (\"Final PL\" column)\n"
        "   Regenerate: python3 tools/build-pl-content.py [workbook.xlsx]\n"
        "   ============================================================ */\n"
        "window.PL_CONTENT =\n"
    )
    with open(os.path.abspath(OUT), "w", encoding="utf-8") as f:
        f.write(header + body + ";\n")

    print("wrote %s — %d instruments" % (os.path.abspath(OUT), len(out["instruments"])))
    if fb_home:
        print("  home sheet: %d row(s) fell back to PL draft" % fb_home)
    for k, n in fallbacks.items():
        print("  %s: %d row(s) fell back to PL draft (Final PL blank)" % (k, n))
    if missing:
        print("  MISSING sheets: %s" % ", ".join(missing))


if __name__ == "__main__":
    main()
