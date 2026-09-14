#!/usr/bin/env node
/**
 * Availability audit for every ASIN in the catalog.
 *
 *   npm run check:availability
 *
 * Why this exists: a delisted Amazon product still serves a completely normal
 * looking page — photo, title, price, reviews. The only reliable tell is that
 * the add-to-cart button is gone. Our multi-item cart link does not error on
 * such an item, it silently drops it, so the first sign of trouble is a buyer
 * arriving at a half-empty cart and leaving. Six of the first 86 ASINs we
 * sourced died within days of being added (see problem-products.md).
 *
 * The discriminator is `id="add-to-cart-button"` in the served HTML. Note that
 * the bare string `add-to-cart-button` appears in inline scripts on every page
 * including dead ones, so it must be matched with the id attribute.
 *
 * The important safety property is that a BLOCKED fetch is never reported as a
 * dead product. Amazon serves captcha and throttle pages that contain no cart
 * button, and treating those as delistings would send us ripping working
 * products out of the catalog. Anything that does not look like a real product
 * page is reported as BLOCKED and excluded from the failure count.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const CONCURRENCY = 3;
const DELAY_MS = 700;
const RETRIES = 2;

/* ------------------------------------------------------------------ read --
 * Parsed out of the source rather than imported, so the script stays a plain
 * node file with no build step and no dependency on the app compiling.
 */

function readCatalog() {
  const src = fs.readFileSync(path.join(ROOT, "src/lib/catalog.ts"), "utf8");
  const items = [];
  const re =
    /id: "([^"]+)",[\s\S]*?category: "([^"]+)",[\s\S]*?\.\.\.az\("([A-Z0-9]{10})"\)/g;
  let m;
  while ((m = re.exec(src))) {
    items.push({ id: m[1], category: m[2], asin: m[3] });
  }
  return items;
}

function readTitlesSeen() {
  const src = fs.readFileSync(path.join(ROOT, "src/lib/amazon-data.ts"), "utf8");
  const seen = {};
  const re = /"([a-z0-9-]+)": \{[\s\S]*?titleSeen: "((?:[^"\\]|\\.)*)"/g;
  let m;
  while ((m = re.exec(src))) seen[m[1]] = m[2].replace(/\\"/g, '"');
  return seen;
}

/* ----------------------------------------------------------------- probe -- */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** OK | DEAD | BLOCKED, plus the title we saw. */
async function probe(asin) {
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    if (attempt) await sleep(1500 * attempt);
    let html;
    try {
      const res = await fetch(`https://www.amazon.com/dp/${asin}`, {
        headers: {
          "User-Agent": UA,
          "Accept-Language": "en-US,en;q=0.9",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
      if (res.status === 404) return { state: "DEAD", note: "404" };
      html = await res.text();
    } catch (err) {
      continue; // network blip — retry
    }

    // A real product page always carries a product title. Captcha pages,
    // throttle pages and interstitials do not. Anything without one tells us
    // nothing about the product, so never let it count as a delisting.
    const title = /id="productTitle"[^>]*>([^<]+)</.exec(html)?.[1]?.trim();
    if (!title) continue;

    const hasCart = /id="add-to-cart-button"/.test(html);
    return { state: hasCart ? "OK" : "DEAD", title: decodeEntities(title) };
  }
  return { state: "BLOCKED", note: "no product page after retries" };
}

/* --------------------------------------------------------------- titles -- */

const ENTITIES = {
  amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ", "#39": "'", "#34": '"',
};

function decodeEntities(input) {
  return input.replace(/&(#?\w+);/g, (whole, name) => {
    if (ENTITIES[name]) return ENTITIES[name];
    if (/^#\d+$/.test(name)) return String.fromCharCode(Number(name.slice(1)));
    return whole;
  });
}

/** Words this common carry no identifying signal, so they are not evidence. */
const STOP = new Set([
  "for", "with", "and", "the", "of", "to", "in", "home", "gym", "fitness",
  "set", "inch", "lb", "lbs", "series",
]);

function tokens(title) {
  return new Set(
    decodeEntities(title)
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w)),
  );
}

/** Share of the shorter title's distinctive words that appear in the other. */
function tokenOverlap(a, b) {
  const ta = tokens(a);
  const tb = tokens(b);
  if (!ta.size || !tb.size) return 1;
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  return shared / Math.min(ta.size, tb.size);
}

/* ------------------------------------------------------------------ run -- */

async function main() {
  const items = readCatalog();
  const titlesSeen = readTitlesSeen();
  console.log(`Checking ${items.length} ASINs...\n`);

  const results = [];
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const item = items[cursor++];
      const out = await probe(item.asin);
      results.push({ ...item, ...out });
      const mark =
        out.state === "OK" ? "ok  " : out.state === "DEAD" ? "DEAD" : "????";
      console.log(
        `${mark}  ${item.asin}  ${item.id}${out.note ? `  (${out.note})` : ""}`,
      );
      await sleep(DELAY_MS);
    }
  }

  await Promise.all(
    Array.from({ length: CONCURRENCY }, () => worker()),
  );

  const dead = results.filter((r) => r.state === "DEAD");
  const blocked = results.filter((r) => r.state === "BLOCKED");

  // A repointed ASIN is the quieter failure: the listing still sells, just not
  // the product we described.
  //
  // Comparing titles literally is useless here. Amazon rewrites them
  // constantly - dropping the brand prefix, appending a paragraph of keywords,
  // swapping "and" for "&" - and the served HTML is entity-encoded. So the
  // test is token overlap: if most of the distinctive words we recorded still
  // appear, it is the same product wearing a new title.
  const repointed = results.filter((r) => {
    const before = titlesSeen[r.id];
    if (!before || !r.title) return false;
    return tokenOverlap(before, r.title) < 0.6;
  });

  const line = "-".repeat(64);
  console.log(`\n${line}`);
  console.log(
    `ok ${results.length - dead.length - blocked.length}   dead ${dead.length}   unchecked ${blocked.length}`,
  );

  if (dead.length) {
    console.log("\nDEAD — cannot be added to a cart, replace these:");
    for (const d of dead) console.log(`  ${d.asin}  ${d.id}  [${d.category}]`);

    const byCategory = {};
    for (const d of dead) byCategory[d.category] = (byCategory[d.category] ?? 0) + 1;
    const total = {};
    for (const i of items) total[i.category] = (total[i.category] ?? 0) + 1;
    const thin = Object.entries(byCategory)
      .filter(([c, n]) => total[c] - n < 3)
      .map(([c, n]) => `${c} (${total[c] - n} left)`);
    if (thin.length) {
      console.log(
        `\n  Categories dropping below three live options: ${thin.join(", ")}`,
      );
    }
  }

  if (repointed.length) {
    console.log("\nTITLE CHANGED — check the ASIN still points at our product:");
    for (const r of repointed) {
      console.log(`  ${r.asin}  ${r.id}`);
      console.log(`      was: ${titlesSeen[r.id]}`);
      console.log(`      now: ${r.title}`);
    }
  }

  if (blocked.length) {
    console.log(
      "\nUNCHECKED — Amazon did not serve a product page. Not a delisting;",
    );
    console.log("re-run later or check these by hand:");
    for (const b of blocked) console.log(`  ${b.asin}  ${b.id}`);
  }

  const reportPath = path.join(ROOT, "availability-report.json");
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      { checkedOn: new Date().toISOString().slice(0, 10), results },
      null,
      2,
    ),
  );
  console.log(`\nWrote ${path.relative(ROOT, reportPath)}`);

  process.exit(dead.length ? 1 : 0);
}

main();
