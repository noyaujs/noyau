import { buildAssetsURL, publicAssetsURL } from "#noyau/paths";
import { defineNoyauRenderer, type RendererResponse } from "#noyau/renderer";

// @ts-expect-error private property consumed by vite-generated url helpers
globalThis.__buildAssetsURL = buildAssetsURL;
// @ts-expect-error private property consumed by vite-generated url helpers
globalThis.__publicAssetsURL = publicAssetsURL;

interface ClientManifest {}

type LinkAttributes = {
  rel: string | null;
  href: string;
  as?: string | null;
  type?: string | null;
  crossorigin?: "" | null;
};

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

function renderLinkToString(attrs: LinkAttributes) {
  return `<link${Object.entries(attrs)
    .map(([key, value]: [string, LinkAttributes[keyof LinkAttributes]]) =>
      value === null ? "" : value ? ` ${key}="${value}"` : " " + key
    )
    .join("")}>`;
}

export default defineNoyauRenderer(async (event) => {
  const manifest = await getClientManifest();

  return {
    htmlContext: {
      head: [...renderManifestCss(manifest)],
      body: ['<div id="app"></div>'],
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

const renderManifestCss = (manifest: ClientManifest) => {
  return Object.values(manifest)
    .filter((resource) => resource.resourceType === "style")
    .map((resource) =>
      renderLinkToString({
        rel: "stylesheet",
        href: buildAssetsURL(resource.file),
      })
    );
};
