import { defineRenderHandler } from "#internal/nitro";
import { useNitroApp } from "#internal/nitro/app";
import { buildAssetsURL } from "#paths";
import { type RenderResponse } from "nitropack";
import { buildAssetsURL, publicAssetsURL } from "#paths";

// @ts-expect-error private property consumed by vite-generated url helpers
globalThis.__buildAssetsURL = buildAssetsURL;
// @ts-expect-error private property consumed by vite-generated url helpers
globalThis.__publicAssetsURL = publicAssetsURL;

interface ClientManifest {}

// @ts-expect-error file will be produced after app build
const getClientManifest: () => Promise<Manifest> = () =>
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

export default defineRenderHandler(
  async (event): Promise<Partial<RenderResponse>> => {
    const nitroApp = useNitroApp();
    const manifest = await getClientManifest();

    const htmlContext = {
      bodyAppend: [],
      bodyPrepend: [],
      headAppend: [],
      headPrepend: [],
    };

    await nitroApp.hooks.callHook("render:html", htmlContext);

    const response: RenderResponse = {
      body: `<!DOCTYPE html><head></head><body><div id="app"></div>${renderManifestScript(
        manifest
      )}${htmlContext.bodyAppend.join("/n")}</body></html>`,
      statusCode: event.node.res.statusCode,
      statusMessage: event.node.res.statusMessage,
      headers: {
        "content-type": "text/html;charset=utf-8",
        "x-powered-by": "Noyau",
      },
    };

    return response;
  }
);

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
