#!/usr/bin/env node
/* ============================================================
   Pre-render the static PL build (run after tools/build-pl-static.py).

   Each page's header, content and footer are drawn by JavaScript, so the
   browser shows nothing until every script has loaded and run. This step
   opens each built page in headless Chrome, lets the scripts draw it, and
   writes the finished <body> back into the HTML file. Visitors then see the
   page as soon as the HTML and CSS arrive (faster FCP / LCP / Speed Index,
   no header layout shift); the scripts still run and redraw the same markup.

   Live TradingView widgets are blocked while rendering and their containers
   are saved empty, so each widget is injected once, by the page's own script.
   <html class="pre"> switches the entry animations off (css/styles.css),
   so the redraw of identical markup is invisible.

   Usage:  node tools/prerender-pl.js [dist-pl]
   Needs:  npm i puppeteer-core  (and Google Chrome; set CHROME_PATH if it is
           not in the default macOS location)
   ============================================================ */
const fs = require("fs"), path = require("path"), http = require("http");
const puppeteer = require("puppeteer-core");

const DIST = path.resolve(process.argv[2] || path.join(__dirname, "..", "dist-pl"));
const ROOT = path.join(DIST, "pl", "trading-instruments");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css",
  ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".json": "application/json" };

function pages(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(function (d) {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return d.name === "js" || d.name === "css" || d.name === "assets" ? [] : pages(p);
    return d.name === "index.html" ? [p] : [];
  });
}

(async function () {
  const server = http.createServer(function (req, res) {
    let f = path.join(DIST, decodeURIComponent(req.url.split("?")[0]));
    if (f.endsWith("/")) f += "index.html";
    fs.readFile(f, function (err, buf) {
      if (err) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream" });
      res.end(buf);
    });
  }).listen(0);
  const base = "http://127.0.0.1:" + server.address().port;
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
  const list = pages(ROOT);
  for (const file of list) {
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on("request", function (r) { return /tradingview/.test(r.url()) ? r.abort() : r.continue(); });
    const errors = [];
    page.on("pageerror", function (e) { errors.push(e.message); });
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(base + "/" + path.relative(DIST, file).replace(/index\.html$/, ""), { waitUntil: "networkidle0" });
    const body = await page.evaluate(function () {
      /* TradingView containers go back to empty: the page's script injects each widget */
      document.querySelectorAll("[class^='tv-'], [class*=' tv-']").forEach(function (el) { el.innerHTML = ""; });
      return document.body.innerHTML.trim();
    });
    if (errors.length) throw new Error(file + ": " + errors.join("; "));
    if (!/id="app"[^>]*>\s*</.test(body) && !/class="hero/.test(body)) throw new Error(file + ": nothing rendered");
    let html = fs.readFileSync(file, "utf8");
    html = html.replace(/<html([^>]*)>/, function (m, a) {
      a = a.replace(/\sclass="[^"]*"/, "");
      return "<html" + a + ' class="pre">';
    });
    html = html.replace(/<body([^>]*)>[\s\S]*<\/body>/, function (m, a) { return "<body" + a + ">\n" + body + "\n</body>"; });
    fs.writeFileSync(file, html);
    await page.close();
  }
  await browser.close();
  server.close();
  console.log("pre-rendered " + list.length + " pages in " + ROOT);
})().catch(function (e) { console.error(e.message); process.exit(1); });
