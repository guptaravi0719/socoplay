import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the SocoPlay discovery hub", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>SocoPlay — mini games that save on your device<\/title>/i);
  assert.match(html, /Pick a game\./);
  assert.match(html, /4 games live/);
  assert.match(html, /href="\/games\/solitaire"/);
  assert.match(html, /href="\/games\/tile-shift"/);
  assert.match(html, /href="\/games\/flip-pairs"/);
  assert.match(html, /href="\/games\/word-bloom"/);
  assert.match(html, /ADVERTISEMENT/);
  assert.doesNotMatch(html, /Your site is taking shape|react-loading-skeleton/i);
});

test("keeps SocoPlay branding and device-save migration in the source", async () => {
  const [page, layout, storage, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/storage.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /className="soco-page"/);
  assert.match(page, /SocoPlay/);
  assert.match(page, /storageKeys\.favourites/);
  assert.match(layout, /title: "SocoPlay — mini games that save on your device"/);
  assert.match(storage, /legacyStorageKeys/);
  assert.match(storage, /socoplay:v2:save:solitaire/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  await assert.rejects(access(new URL("../app/_sites-preview", templateRoot)));
});
