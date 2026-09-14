#!/usr/bin/env node
/**
 * Deep product verification: does each catalog row still describe the thing
 * its ASIN sells?
 *
 *   npm run verify:products
 *
 * `check-availability.mjs` answers "can this be bought". This answers the
 * harder question — "is it the right product, at roughly the right size,
 * weight and price". Those are the details that make a planner trustworthy: a
 * rack listed 13 inches shorter than reality is worse than a dead link,
 * because the buyer only finds out after it arrives.
 *
 * IMPORTANT CAVEAT ON DIMENSIONS. Amazon's "Product Dimensions" field is
 * usually the SHIPPING BOX, not the assembled item. A power rack ships as a
 * 1.2m carton of tubes. So a mismatch here is a prompt to go and look, never
 * proof the catalog is wrong — our numbers are assembled footprints and are
 * often correct where Amazon's are useless. Weight is more reliable, since
 * shipping weight and item weight are close for most gym gear.
 *
 * Everything is reported, nothing is auto-corrected.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const CONCURRENCY = 2;
const DELAY_MS = 1600;
const RETRIES = 2;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ----------------------------------------------------------------- parse -- */

/** Pull the full catalog rows we care about straight out of the source. */
function readCatalog() {
  const src = fs.readFileSync(path.join(ROOT, "src/lib/catalog.ts"), "utf8");
  const items = [];
  const blocks = src.split(/\n  \{\n/).slice(1);
  for (const block of blocks) {
    const get = (key) => {
      const m = new RegExp(`${key}: ([0-9.]+)`).exec(block);
      return m ? Number(m[1]) : undefined;
    };
    const str = (key) => {
      const m = new RegExp(`${key}: (?:"([^"]*)"|'([^']*)')`).exec(block);
      return m ? (m[1] ?? m[2]) : undefined;
    };
    const asin = /\.\.\.az\("([A-Z0-9]{10})"\)/.exec(block)?.[1];
    const id = str("id");
    if (!id || !asin) continue;
    items.push({
      id,
      asin,
      name: str("name"),
      brand: str("brand"),
      category: str("category"),
      widthIn: get("widthIn"),
      depthIn: get("depthIn"),
      heightIn: get("heightIn"),
      weightLbs: get("weightLbs"),
      estPriceUsd: get("estPriceUsd"),
    });
  }
  return items;
}

const ENT = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ", "#39": "'", "#34": '"' };
const decode = (s) =>
  s.replace(/&(#?\w+);/g, (w, n) =>
    ENT[n] ?? (/^#\d+$/.test(n) ? String.fromCharCode(Number(n.slice(1))) : w),
  );

/** "63"D x 47"W x 82.7"H" -> {d,w,h} in inches. Handles cm and feet too. */
function parseDims(text) {
  if (!text) return null;
  const t = decode(text).replace(/&quot;/g, '"');
  const out = {};
  const re = /([\d.]+)\s*(?:"|inches|in\b|cm|centimeters)?\s*([DWH])\b/gi;
  let m;
  while ((m = re.exec(t))) out[m[2].toUpperCase()] = Number(m[1]);
  if (out.D || out.W || out.H) return { d: out.D, w: out.W, h: out.H };

  // "24 x 96 x 20 inches" style
  const triple = /([\d.]+)\s*x\s*([\d.]+)\s*x\s*([\d.]+)\s*(inches|in\b|cm)?/i.exec(t);
  if (triple) {
    let [, a, b, c, unit] = triple;
    let [x, y, z] = [Number(a), Number(b), Number(c)];
    if (unit && /cm/i.test(unit)) [x, y, z] = [x / 2.54, y / 2.54, z / 2.54];
    return { d: x, w: y, h: z };
  }
  return null;
}

/** "44.1 Pounds" / "2.5 kg" / "16 ounces" -> pounds. */
function parseWeight(text) {
  if (!text) return null;
  const t = decode(text);
  const m = /([\d.]+)\s*(pounds|lbs?|kilograms|kg|ounces|oz)/i.exec(t);
  if (!m) return null;
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  if (unit.startsWith("k")) return n * 2.20462;
  if (unit.startsWith("o")) return n / 16;
  return n;
}

/** Detail tables and bullet lists both hold the spec rows; read either. */
function specValue(html, label) {
  const rowRe = new RegExp(
    `${label}[^<]*<\\/(?:th|span)>\\s*<t?d?[^>]*>?\\s*<?[^>]*>?([^<]{1,80})`,
    "i",
  );
  const row = rowRe.exec(html);
  if (row) return row[1].trim();
  const bulletRe = new RegExp(
    `${label}[^<]*<\\/span>\\s*<span[^>]*>\\s*([^<]{1,80})`,
    "i",
  );
  return bulletRe.exec(html)?.[1]?.trim() ?? null;
}

/* ----------------------------------------------------------------- fetch -- */

async function probe(asin) {
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    if (attempt) await sleep(2000 * attempt);
    let html;
    try {
      const res = await fetch(`https://www.amazon.com/dp/${asin}`, {
        headers: {
          "User-Agent": UA,
          "Accept-Language": "en-US,en;q=0.9",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
      html = await res.text();
    } catch {
      continue;
    }
    const title = /id="productTitle"[^>]*>([^<]+)</.exec(html)?.[1]?.trim();
    if (!title) continue;

    const priceText =
      /class="a-offscreen"[^>]*>\s*\$([\d,]+\.\d{2})/.exec(html)?.[1] ?? null;

    return {
      ok: true,
      title: decode(title),
      resolvedAsin: /"currentAsin"\s*:\s*"([A-Z0-9]{10})"/.exec(html)?.[1] ?? null,
      priceUsd: priceText ? Number(priceText.replace(/,/g, "")) : null,
      dimsText:
        specValue(html, "Product Dimensions") ??
        specValue(html, "Item Dimensions"),
      weightText:
        specValue(html, "Item Weight") ?? specValue(html, "Item Package Weight"),
    };
  }
  return { ok: false };
}

/* ------------------------------------------------------------------- run -- */

const STOP = new Set([
  "for", "with", "and", "the", "of", "to", "in", "home", "gym", "fitness",
  "set", "inch", "lb", "lbs", "series", "pro", "black",
]);
const tokens = (s) =>
  new Set(
    decode(s).toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w)),
  );

function overlap(a, b) {
  const ta = tokens(a), tb = tokens(b);
  if (!ta.size || !tb.size) return 1;
  let n = 0;
  for (const t of ta) if (tb.has(t)) n++;
  return n / Math.min(ta.size, tb.size);
}

async function main() {
  const items = readCatalog();
  console.log(`Verifying ${items.length} products against their listings...\n`);

  const findings = [];
  const unchecked = [];
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const item = items[cursor++];
      const live = await probe(item.asin);
      if (!live.ok) {
        unchecked.push(item);
        console.log(`????  ${item.id}`);
        await sleep(DELAY_MS);
        continue;
      }

      const issues = [];

      if (live.resolvedAsin && live.resolvedAsin !== item.asin) {
        issues.push({
          sev: 1,
          msg: `variation parent / redirect -> ${live.resolvedAsin}`,
        });
      }

      // Does the listing still sell what the row claims? Brand is the strongest
      // single token, so check it separately from general title overlap.
      const brandOk =
        !item.brand ||
        tokens(live.title).has(item.brand.toLowerCase().split(/\s+/)[0]) ||
        overlap(item.brand, live.title) > 0.4;
      const nameOverlap = overlap(item.name ?? "", live.title);
      if (!brandOk && nameOverlap < 0.45) {
        issues.push({
          sev: 1,
          msg: `looks like a different product: "${live.title.slice(0, 70)}"`,
        });
      }

      if (live.priceUsd && item.estPriceUsd) {
        const drift = Math.abs(item.estPriceUsd - live.priceUsd) / live.priceUsd;
        if (drift > 0.15) {
          issues.push({
            sev: 2,
            msg: `price est $${item.estPriceUsd} vs listing $${live.priceUsd} (${Math.round(drift * 100)}% off)`,
          });
        }
      }

      const w = parseWeight(live.weightText);
      if (w && item.weightLbs) {
        const drift = Math.abs(item.weightLbs - w) / w;
        // Wide band: Amazon often lists shipping weight, and plate/dumbbell
        // sets list one piece rather than the set.
        if (drift > 0.5 && Math.abs(item.weightLbs - w) > 8) {
          issues.push({
            sev: 3,
            msg: `weight ${item.weightLbs} lb vs listing ${w.toFixed(1)} lb`,
          });
        }
      }

      const d = parseDims(live.dimsText);
      if (d && d.w && d.d && d.h && item.widthIn) {
        // Compare as unordered sets — Amazon's D/W/H labelling is inconsistent.
        const ours = [item.widthIn, item.depthIn, item.heightIn].sort((a, b) => a - b);
        const theirs = [d.w, d.d, d.h].sort((a, b) => a - b);
        const worst = Math.max(
          ...ours.map((v, i) => Math.abs(v - theirs[i]) / Math.max(theirs[i], 1)),
        );
        if (worst > 0.4) {
          issues.push({
            sev: 3,
            msg: `dims ${ours.join("x")} vs listing ${theirs.map((n) => n.toFixed(0)).join("x")} (may be box size)`,
          });
        }
      }

      if (issues.length) findings.push({ item, live, issues });
      console.log(
        `${issues.length ? "FLAG" : "ok  "}  ${item.id}${issues.length ? "  " + issues.length : ""}`,
      );
      await sleep(DELAY_MS);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  console.log("\n" + "=".repeat(70));
  const bySev = [1, 2, 3];
  const labels = {
    1: "WRONG PRODUCT — fix before anything else",
    2: "PRICE DRIFT — our estimate misleads the buyer",
    3: "SIZE / WEIGHT — check by hand, Amazon may be quoting the box",
  };
  for (const sev of bySev) {
    const rows = findings.filter((f) => f.issues.some((i) => i.sev === sev));
    if (!rows.length) continue;
    console.log(`\n${labels[sev]}`);
    for (const f of rows) {
      for (const i of f.issues.filter((i) => i.sev === sev)) {
        console.log(`  ${f.item.id.padEnd(30)} ${i.msg}`);
      }
    }
  }
  if (!findings.length) console.log("\nNo discrepancies found.");
  console.log(
    `\nchecked ${items.length - unchecked.length}   flagged ${findings.length}   unchecked ${unchecked.length}`,
  );
  if (unchecked.length) {
    console.log(`unchecked: ${unchecked.map((i) => i.id).join(", ")}`);
  }

  fs.writeFileSync(
    path.join(ROOT, "product-verification.json"),
    JSON.stringify({ checkedOn: new Date().toISOString().slice(0, 10), findings, unchecked }, null, 2),
  );
  console.log("\nWrote product-verification.json");
}

main();
