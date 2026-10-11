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

test("server-renders the SocoPlay hub with only its live games", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.ok(html.includes("<title>SocoPlay | Free Online Mini Games</title>"));
  assert.ok(html.includes('href="https://socoplay.com"'));
  assert.match(html, /Small games\. <em>Big little wins\.<\/em>/);
  assert.match(html, /Pick a game and play/);
  assert.match(html, /FREE ONLINE MINI GAMES/);
  assert.match(html, /href="\/games\/2048"/);
  assert.match(html, /href="\/games\/solitaire"/);
  assert.match(html, /href="\/games\/tower"/);
  for (const slug of ["chess", "asteroids", "pacman", "sudoku", "checkers"]) assert.match(html, new RegExp(`href="\\/games\\/${slug}"`));
  assert.doesNotMatch(html, /\/games\/(tile-shift|flip-pairs|word-bloom|tap-tap-basketball|slice-sprint)/);
  assert.doesNotMatch(html, /saved locally|local save|saved on this device|continue playing/i);
  assert.doesNotMatch(html, /ADVERTISEMENT/);
  assert.match(html, /<meta name="5421c45dfdd37f0e6932529f2116ce283985f019" content="5421c45dfdd37f0e6932529f2116ce283985f019"\/>/);
  assert.match(html, /<meta name="referrer" content="no-referrer-when-downgrade"\/>/);
  assert.doesNotMatch(html, /adsbygoogle|pagead2|ca-pub-5695136510723463/i);
  assert.match(html, /application\/ld\+json/);
  assert.doesNotMatch(html, /Your site is taking shape|react-loading-skeleton/i);
});

test("server-renders the playable game pages for crawlers", async () => {
  const routes = [
    {
      path: "/games/2048",
      title: "Play 2048 Online | SocoPlay",
      heading: "2048",
      description: "Play 2048 online for free. Slide and merge number tiles, chase 2048, and build your highest score.",
    },
    {
      path: "/games/solitaire",
      title: "Play Solitaire Online | SocoPlay",
      heading: "Solitaire",
      description: "Play free classic Klondike Solitaire online with touch-friendly cards, Turn 1 or Turn 3 play, hints, and undo.",
    },
    {
      path: "/games/tower",
      title: "Play Tower Stack Online | SocoPlay",
      heading: "Tower Stack",
      description: "Play Tower Stack online for free. Time each drop, stack the blocks neatly, and build your tallest tower.",
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
    assert.doesNotMatch(html, /SPONSORED BREAK|Continue to game|unfolded-uncle\.com|unfoldedtrade\.com/, `${route.path} removed pop-up ad scripts`);
    assert.match(html, /VideoGame/, `${route.path} structured data`);
    assert.doesNotMatch(html, /saved locally|local save|saved on this device/i, `${route.path} removed copy`);
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
  for (const path of ["", "/games/solitaire", "/games/2048", "/games/tower", "/games/chess", "/games/asteroids", "/games/pacman", "/games/sudoku", "/games/checkers"]) {
    assert.ok(sitemap.includes(`<loc>${publicOrigin}${path}</loc>`), `sitemap includes ${path || "/"}`);
  }
  assert.doesNotMatch(sitemap, /tile-shift|flip-pairs|word-bloom|tap-tap-basketball|slice-sprint/);

  assert.equal(manifestResponse.status, 200);
  assert.match(manifestResponse.headers.get("content-type") ?? "", /application\/manifest\+json/i);
  const manifest = await manifestResponse.json();
  assert.equal(manifest.name, "SocoPlay — Free Online Mini Games");
  assert.equal(manifest.short_name, "SocoPlay");
});

test("keeps SocoPlay branding, social assets, and only the remaining game routes", async () => {
  const [page, layout, storage, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/storage.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /className="arcade-page"/);
  assert.match(page, /SocoPlay/);
  assert.doesNotMatch(page, /tile-shift|flip-pairs|word-bloom|tap-tap-basketball|slice-sprint/);
  assert.match(layout, /metadataBase: new URL\("https:\/\/socoplay\.com"\)/);
  assert.match(layout, /manifest: "\/manifest\.webmanifest"/);
  assert.doesNotMatch(layout, /next\/font\/google/);
  assert.match(storage, /legacyStorageKeys/);
  assert.match(storage, /socoplay:v2:save:solitaire/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  await access(new URL("../public/og.png", import.meta.url));
  await access(new URL("../public/tower-game/tower-game.js", import.meta.url));
  await access(new URL("../public/tower-game/LICENSE", import.meta.url));
  await access(new URL("../public/arcade-classics/LICENSE", import.meta.url));
  await access(new URL("../public/arcade-classics/soco-audio.js", import.meta.url));
  await assert.rejects(access(new URL("../app/games/tap-tap-basketball", templateRoot)));
  await assert.rejects(access(new URL("../app/games/slice-sprint", templateRoot)));
  await assert.rejects(access(new URL("../app/_sites-preview", templateRoot)));
});
