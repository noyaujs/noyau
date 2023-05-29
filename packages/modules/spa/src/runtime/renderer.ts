import { buildAssetsURL, publicAssetsURL } from "#noyau/paths";
import { defineNoyauRenderer, type RendererResponse } from "#noyau/renderer";

// @ts-expect-error private property consumed by vite-generated url helpers
globalThis.__buildAssetsURL = buildAssetsURL;
// @ts-expect-error private property consumed by vite-generated url helpers
globalThis.__publicAssetsURL = publicAssetsURL;

interface ClientManifest {}

const getClientManifest: () => Promise<ClientManifest> = () =>
  // @ts-expect-error file will be produced after app build
  import("#build/dist/server/client.manifest.mjs")
    .then((r) => r.default || r)
    .then((r) =>
      typeof r === "function" ? r() : r
    ) as Promise<ClientManifest>;

function renderScriptToString(attrs: Record<string, string | null>) {
  return `<script${Object.entries(attrs)
    .map(([key, value]) =>
      value === null ? "" : value ? ` ${key}="${value}"` : " " + key
    )
    .join("")}></script>`;
}

export default defineNoyauRenderer(async (event) => {
  const manifest = await getClientManifest();

  return {
    htmlContext: {
      body: ['<div id="app"></div>'],
      head: [],
      bodyAppend: [...renderManifestScript(manifest)],
    },
  } satisfies RendererResponse;
});

const renderManifestScript = (manifest: ClientManifest) => {
  return Object.values(manifest)
    .filter((resource) => resource.resourceType === "script")
    .map((resource) =>
      renderScriptToString({
        type: resource.module ? "module" : null,
        src: buildAssetsURL(resource.file),
        defer: resource.module ? null : "",
        crossorigin: "",
      })
    );
};
