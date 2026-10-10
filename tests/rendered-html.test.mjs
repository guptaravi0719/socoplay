import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);
const publicOrigin = "https://socoplay.com";

async function render(pathname = "/", accept = "text/html") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`${publicOrigin}${pathname}`, { headers: { accept } }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the SocoPlay discovery hub with indexable game content", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.ok(html.includes("<title>SocoPlay | Free Online Mini Games</title>"));
  assert.ok(html.includes('href="https://socoplay.com"'));
  assert.match(html, /Small games\. <em>Big little wins\.<\/em>/);
  assert.match(html, /Continue playing/);
  assert.match(html, /Top picks for your break/);
  assert.match(html, /FREE ONLINE MINI GAMES/);
  assert.match(html, /live now/);
  assert.match(html, /href="\/games\/solitaire"/);
  assert.match(html, /href="\/games\/tile-shift"/);
  assert.match(html, /href="\/games\/flip-pairs"/);
  assert.match(html, /href="\/games\/word-bloom"/);
  assert.match(html, /ADVERTISEMENT/);
  assert.match(html, /application\/ld\+json/);
  assert.doesNotMatch(html, /Your site is taking shape|react-loading-skeleton/i);
});

test("server-renders unique, playable game pages for crawlers", async () => {
  const routes = [
    {
      path: "/games/solitaire",
      title: "Play Solitaire Online | SocoPlay",
      heading: "Solitaire",
      description: "Play free classic Klondike Solitaire online with touch-friendly cards, Turn 1 or Turn 3 play, hints, undo, and device-local saves.",
    },
    {
      path: "/games/tile-shift",
      title: "Play Tile Shift Online | SocoPlay",
      heading: "Tile Shift",
      description: "Play Tile Shift, a free online number sliding puzzle. Move tiles into order and pick up your saved board on the same device.",
    },
    {
      path: "/games/flip-pairs",
      title: "Play Flip Pairs Online | SocoPlay",
      heading: "Flip Pairs",
      description: "Play Flip Pairs, a free online memory matching game. Find every pair, track your tries, and continue later on the same device.",
    },
    {
      path: "/games/word-bloom",
      title: "Play Word Bloom Online | SocoPlay",
      heading: "Word Bloom",
      description: "Play Word Bloom, a free online word unscramble game. Rearrange the letters, solve the word, and save your progress locally.",
    },
  ];

  for (const route of routes) {
    const response = await render(route.path);
    assert.equal(response.status, 200, route.path);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i, route.path);

    const html = await response.text();
    assert.ok(html.includes(`<title>${route.title}</title>`), `${route.path} title`);
    assert.ok(html.includes(`content="${route.description}"`), `${route.path} description`);
    assert.ok(html.includes(`<link rel="canonical" href="${publicOrigin}${route.path}"/>`), `${route.path} canonical`);
    assert.ok(html.includes(`<meta property="og:title" content="${route.title}"/>`), `${route.path} Open Graph title`);
    assert.ok(html.includes(`<h1>${route.heading}</h1>`), `${route.path} visible heading`);
    assert.match(html, /How to play/, `${route.path} guide`);
    assert.match(html, /VideoGame/, `${route.path} structured data`);
    assert.doesNotMatch(html, /game-loading|Opening (Tile Shift|Flip Pairs|Word Bloom)|Setting your table/i, `${route.path} loading shell`);
  }
});

test("publishes a crawlable sitemap, robots policy, and web manifest", async () => {
  const [robotsResponse, sitemapResponse, manifestResponse] = await Promise.all([
    render("/robots.txt", "text/plain"),
    render("/sitemap.xml", "application/xml"),
    render("/manifest.webmanifest", "application/manifest+json"),
  ]);

  assert.equal(robotsResponse.status, 200);
  assert.match(robotsResponse.headers.get("content-type") ?? "", /^text\/plain\b/i);
  const robots = await robotsResponse.text();
  assert.match(robots, /User-Agent: \*/i);
  assert.match(robots, /Allow: \//i);
  assert.match(robots, new RegExp(`Sitemap: ${publicOrigin}/sitemap\\.xml`, "i"));

  assert.equal(sitemapResponse.status, 200);
  assert.match(sitemapResponse.headers.get("content-type") ?? "", /(?:application|text)\/xml/i);
  const sitemap = await sitemapResponse.text();
  assert.match(sitemap, /<urlset /i);
  for (const path of ["", "/games/solitaire", "/games/tile-shift", "/games/flip-pairs", "/games/word-bloom"]) {
    assert.ok(sitemap.includes(`<loc>${publicOrigin}${path}</loc>`), `sitemap includes ${path || "/"}`);
  }

  assert.equal(manifestResponse.status, 200);
  assert.match(manifestResponse.headers.get("content-type") ?? "", /application\/manifest\+json/i);
  const manifest = await manifestResponse.json();
  assert.equal(manifest.name, "SocoPlay — Free Online Mini Games");
  assert.equal(manifest.short_name, "SocoPlay");
});

test("keeps SocoPlay branding, social assets, and device-save migration in the source", async () => {
  const [page, layout, storage, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/storage.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /className="arcade-page"/);
  assert.match(page, /SocoPlay/);
  assert.match(page, /storageKeys\.favourites/);
  assert.match(layout, /metadataBase: new URL\("https:\/\/socoplay\.com"\)/);
  assert.match(layout, /manifest: "\/manifest\.webmanifest"/);
  assert.doesNotMatch(layout, /next\/font\/google/);
  assert.match(storage, /legacyStorageKeys/);
  assert.match(storage, /socoplay:v2:save:solitaire/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  await access(new URL("../public/og.png", import.meta.url));
  await assert.rejects(access(new URL("../app/_sites-preview", templateRoot)));
});
