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
  assert.ok(html.includes('href="https://tools.socoplay.com/diff-checker"'));
  assert.doesNotMatch(html, /Small games\. <em>Big little wins\.<\/em>/);
  assert.match(html, /<h1[^>]*>Free Online Mini Games<\/h1>/);
  assert.match(html, /FREE ONLINE MINI GAMES/);
  assert.match(html, /adsbygoogle|pagead2|ca-pub-5695136510723463/i);
  assert.match(html, /href="\/games\/2048"/);
  assert.match(html, /href="\/games\/solitaire"/);
  assert.match(html, /href="\/games\/spider-solitaire"/);
  assert.match(html, /href="\/games\/tower"/);
  for (const slug of ["chess", "asteroids", "pacman", "sudoku", "checkers"]) assert.match(html, new RegExp(`href="\\/games\\/${slug}"`));
  assert.doesNotMatch(html, /\/games\/(tile-shift|flip-pairs|word-bloom|tap-tap-basketball|slice-sprint)/);
  assert.doesNotMatch(html, /saved locally|local save|saved on this device|continue playing/i);
  assert.doesNotMatch(html, /ADVERTISEMENT/);
  assert.doesNotMatch(html, /<meta name="5421c45dfdd37f0e6932529f2116ce283985f019"/);
  assert.doesNotMatch(html, /<meta name="referrer" content="no-referrer-when-downgrade"\/>/);
  assert.doesNotMatch(html, /unfoldedtrade\.com|unfolded-uncle\.com/i);
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
      path: "/games/spider-solitaire",
      title: "Play Spider Solitaire Online | SocoPlay",
      heading: "Spider Solitaire",
      description: "Play free Spider Solitaire online with 1, 2, or 4 suits, ten columns, hints, undo, and autosave.",
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
    assert.match(html, new RegExp(`<h1(?: [^>]*)?>${route.heading}</h1>`), `${route.path} heading`);
    assert.match(html, /How to play/, `${route.path} guide`);
    assert.match(html, /adsbygoogle|pagead2|ca-pub-5695136510723463/i, `${route.path} includes AdSense`);
    assert.doesNotMatch(html, /SPONSORED BREAK|Continue to game|unfoldedtrade\.com|unfolded-uncle\.com/, `${route.path} has no third-party click-to-play ad gate`);
    assert.match(html, /VideoGame/, `${route.path} structured data`);
    assert.doesNotMatch(html, /saved locally|local save|saved on this device/i, `${route.path} removed copy`);
  }
});

test("gives every classic game its own canonical metadata and game schema", async () => {
  const routes = [
    ["spider-solitaire", "Play Spider Solitaire Online | SocoPlay"],
    ["chess", "Play Chess Online | SocoPlay"],
    ["asteroids", "Play Asteroids Online | SocoPlay"],
    ["pacman", "Play Pac-Man Online | SocoPlay"],
    ["sudoku", "Play Sudoku Online | SocoPlay"],
    ["checkers", "Play Checkers Online | SocoPlay"],
  ];

  for (const [slug, title] of routes) {
    const response = await render(`/games/${slug}`);
    const html = await response.text();
    assert.ok(html.includes(`<title>${title}</title>`), `${slug} title`);
    assert.ok(html.includes(`<link rel="canonical" href="${publicOrigin}/games/${slug}"/>`), `${slug} canonical`);
    assert.match(html, /VideoGame/, `${slug} game schema`);
    assert.match(html, /og:title/, `${slug} social metadata`);
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
  assert.match(sitemap, /<lastmod>2026-10-11T00:00:00\.000Z<\/lastmod>/);
  for (const path of ["", "/games/solitaire", "/games/spider-solitaire", "/games/2048", "/games/tower", "/games/chess", "/games/asteroids", "/games/pacman", "/games/sudoku", "/games/checkers"]) {
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
  const [page, layout, storage, game2048, towerRoute, packageJson, bannerAd, adsTxt, pacmanPage, pacmanScript, asteroidsPage, sharedAudio] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/storage.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/games/2048/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/games/tower/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../app/components/banner-ad.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/ads.txt", import.meta.url), "utf8"),
    readFile(new URL("../public/arcade-classics/pacman/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/arcade-classics/pacman/script.js", import.meta.url), "utf8"),
    readFile(new URL("../public/arcade-classics/asteroids/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/arcade-classics/soco-audio.js", import.meta.url), "utf8"),
  ]);

  assert.match(page, /className="arcade-page"/);
  assert.match(page, /SocoPlay/);
  assert.match(page, /pageshow/);
  assert.match(page, /tools\.socoplay\.com\/diff-checker/);
  assert.doesNotMatch(page, /tile-shift|flip-pairs|word-bloom|tap-tap-basketball|slice-sprint/);
  assert.match(layout, /metadataBase: new URL\("https:\/\/socoplay\.com"\)/);
  assert.match(layout, /manifest: "\/manifest\.webmanifest"/);
  assert.doesNotMatch(layout, /next\/font\/google/);
  assert.match(storage, /legacyStorageKeys/);
  assert.match(storage, /socoplay:v2:save:solitaire/);
  assert.match(storage, /socoplay:2048:sound/);
  assert.match(game2048, /game-sound-toggle/);
  assert.match(game2048, /Mute 2048 sound/);
  assert.match(game2048, /getGameAudio\(\)/);
  assert.match(towerRoute, /src="\/tower-game\/"/);
  assert.doesNotMatch(towerRoute, /src="\/tower-game\/index\.html"/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
  assert.doesNotMatch(page, /unfolded-uncle\.com\/dJmVFXzhd\.G\/NSvrZmGqUF/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(layout, /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-5695136510723463/);
  assert.match(layout, /msvalidate\.01.*DDA661724504D4A545AED11D60818082/);
  assert.doesNotMatch(bannerAd, /unfoldedtrade|unfolded-uncle|hilltop/i);
  assert.match(adsTxt, /^google\.com, pub-5695136510723463, DIRECT, f08c47fec0942fa0\s*$/);
  assert.match(pacmanPage, /data-direction="up"/);
  assert.match(pacmanPage, /data-direction="down"/);
  assert.match(pacmanPage, /data-direction="left"/);
  assert.match(pacmanPage, /data-direction="right"/);
  assert.match(pacmanScript, /setTouchDirection/);
  assert.match(pacmanScript, /playPelletSound/);
  assert.doesNotMatch(pacmanScript, /startBackgroundSound|backgroundOsc|backgroundInterval/);
  assert.doesNotMatch(pacmanPage, /soco-audio\.js/);
  assert.match(asteroidsPage, /data-soco-sound-slot/);
  assert.match(sharedAudio, /data-soco-sound-slot/);

  await access(new URL("../public/og.png", import.meta.url));
  await access(new URL("../public/tower-game/tower-game.js", import.meta.url));
  await access(new URL("../public/tower-game/LICENSE", import.meta.url));
  const towerPage = await readFile(new URL("../public/tower-game/index.html", import.meta.url), "utf8");
  assert.match(towerPage, /id="play-again"/);
  assert.match(towerPage, /setGameFailed/);
  await access(new URL("../public/arcade-classics/LICENSE", import.meta.url));
  await access(new URL("../public/arcade-classics/soco-audio.js", import.meta.url));
  await assert.rejects(access(new URL("../app/games/tap-tap-basketball", templateRoot)));
  await assert.rejects(access(new URL("../app/games/slice-sprint", templateRoot)));
  await assert.rejects(access(new URL("../app/_sites-preview", templateRoot)));
});
