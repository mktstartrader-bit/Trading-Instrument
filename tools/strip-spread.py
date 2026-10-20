#!/usr/bin/env python3
"""
Remove every mention of spreads from the site copy.

STARTRADER does not publish its spread data, so the pages must not talk about
spreads either (no "compare live spreads", no "tight spreads" claims). Run this
after the content generators, because they copy the workbooks verbatim:

    python3 tools/build-pl-content.py
    python3 tools/build-pl-additional.py
    python3 tools/strip-spread.py          # <- this
    python3 tools/build-pl-static.py --out dist-pl
    node tools/prerender-pl.js dist-pl

Wording is removed, never rewritten: the spread phrase, clause or bullet is cut and
the rest of the approved sentence is kept as it is. Every edit is an exact match;
the script stops if an expected sentence is not found, and fails if the word
"spread" is still present in any page file afterwards. Safe to run twice.
"""
import glob
import json
import os
import re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def path(p):
    return os.path.join(ROOT, p)


def edit(rel, pairs):
    """exact replacements; each must match (or already be applied)"""
    f = path(rel)
    s = open(f, encoding="utf-8").read()
    for a, b in pairs:
        if a in s:
            s = s.replace(a, b)
        elif (b and b in s) or not b:
            continue                      # already applied (a cut to nothing is verified by check())
        else:
            raise SystemExit("%s: expected text not found: %r" % (rel, a[:80]))
    open(f, "w", encoding="utf-8").write(s)


# ---------- js/content-pl.js (Polish + English UI copy, per-instrument sheets, meta) ----------
def content_pl():
    f = path("js/content-pl.js")
    src = open(f, encoding="utf-8").read()
    head, body = src.split("window.PL_CONTENT =", 1)
    C = json.loads(body.strip().rstrip(";"))

    ui = C["ui"]
    ui["pl"]["heroSub"] = ui["pl"]["heroSub"].replace(" — porównaj spready na żywo i otwórz", " — otwórz")
    ui["en"]["heroSub"] = ui["en"]["heroSub"].replace(" — compare live spreads and open", " — open")
    for L in ("pl", "en"):
        # the old price-table column; the table is now TradingView's, the label is never shown
        ui[L]["columns"] = ["" if c == "Spread" else c for c in ui[L]["columns"]]

    for inst in C["instruments"].values():
        inst["why"] = [w for w in inst.get("why", []) if not re.search(r"(?i)spread", w)]
        inst["variants"] = [[v, d.replace(" · surowe spready", "")] for v, d in inst.get("variants", [])]

    for m in C["meta"].values():
        d = m.get("description", "")
        d = d.replace(" Porównaj spready na żywo w Startrader.", "")
        d = re.sub(r", wykres i (?:wąskie )?spready na (\S+) ", r" i wykres \1 ", d)   # "Notowania na żywo i wykres CL-OIL 24/5"
        d = re.sub(r", wykres i (?:wąskie )?spready", " i wykres", d)
        d = d.replace(", wykres na żywo i spready", " i wykres na żywo")
        m["description"] = d

    out = json.dumps(C, ensure_ascii=False, separators=(",", ":"))
    open(f, "w", encoding="utf-8").write(head + "window.PL_CONTENT =\n" + out + ";\n")


# ---------- js/pl-additional/<id>.js (long-form Polish articles) ----------
ADDITIONAL = {
    "bitb": [("płynność danego instrumentu, wielkość spreadu oraz pozostałe koszty transakcyjne",
              "płynność danego instrumentu oraz koszty transakcyjne")],
    "cl-oil": [("Wąskie spready ograniczają koszty częstego handlu, szybka i stabilna realizacja",
                "Szybka i stabilna realizacja")],
    "eurusd": [('{"t":"li","text":"wąskie spready -- koszty otwierania i zamykania pozycji pozostają przejrzyste;"},', ""),
               ("płynność jest najwyższa, a spready zwykle najwęższe.", "płynność jest najwyższa.")],
    "gbpjpy": [("wąskie spready i szybka realizacja zleceń pomagają", "szybka realizacja zleceń pomaga")],
    "gbpusd": [("korzystasz z ultraniskich spreadów, błyskawicznej realizacji", "korzystasz z błyskawicznej realizacji")],
    "usdcad": [("Do dyspozycji masz konkurencyjne spready oraz platformy", "Do dyspozycji masz platformy"),
               ("przy konkurencyjnych spreadach i szybkiej realizacji", "przy szybkiej realizacji")],
    "xauusd": [(" W okresach niższej aktywności spready mogą się rozszerzać -- dobrze uwzględnić to w swoim planie handlowym.", "")],
    "xauaud": [("Przejrzysta struktura kosztów i konkurencyjne spready pomagają", "Przejrzysta struktura kosztów pomaga")],
    "ukousd": [("Różnica cen między tymi benchmarkami, nazywana spreadem, jest", "Różnica cen między tymi benchmarkami jest"),
               ("Ultraniskie spready i szybka realizacja zleceń mają znaczenie", "Szybka realizacja zleceń ma znaczenie")],
}


def additional():
    for pid, pairs in ADDITIONAL.items():
        edit("js/pl-additional/%s.js" % pid, pairs)


# ---------- shared English copy (header/footer, fallbacks, EN home template) ----------
def english():
    edit("js/chrome.js", [("offering deep liquidity, tight spreads and fast execution", "offering deep liquidity and fast execution")])
    edit("js/detail.js", [
        ('return "Prime ECN · raw spreads";', 'return "Prime ECN";'),
        ('return "ECN · raw spreads";', 'return "ECN";'),
        ('return "Zero-spread account";', 'return "Zero account";'),
        ('return "Raw-spread account";', 'return "Raw account";'),
        ("five days a week, with deep liquidity and tight spreads.", "five days a week, with deep liquidity."),
        ('      "Competitive spreads with deep institutional liquidity",\n', ""),
    ])
    edit("index.html", [(" — compare live spreads and open any market", " — open any market")])
    edit("js/tv.js", [("Widgets never show bid/ask, so no spread is published.", "Widgets never show bid/ask prices.")])
    # the demo catalogue used to generate a random spread per instrument for the old price table; nothing reads it
    f = path("js/data.js")
    s = open(f, encoding="utf-8").read()
    s = re.sub(r"\n[ \t]*out\.spread = [^\n]*;", "", s)
    open(f, "w", encoding="utf-8").write(s)


def check():
    files = (glob.glob(path("js/*.js")) + glob.glob(path("js/pl-additional/*.js")) + glob.glob(path("js/content-pl/*.js"))
             + [path("index.html"), path("instrument.html")])
    left = []
    for f in files:
        s = open(f, encoding="utf-8").read()
        for m in re.finditer(r"(?i)spread", s):
            left.append("%s: …%s…" % (os.path.relpath(f, ROOT), s[max(0, m.start() - 50):m.end() + 30].replace("\n", " ")))
    if left:
        raise SystemExit("spread still mentioned:\n  " + "\n  ".join(left))


if __name__ == "__main__":
    content_pl()
    additional()
    english()
    check()
    print("no spread wording left in js/, js/pl-additional/, index.html, instrument.html")
