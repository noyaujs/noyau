import {
  defineRenderHandler,
  getRouteRules,
  useRuntimeConfig,
} from "#internal/nitro";
import { type RenderResponse } from "nitropack";

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
    const manifest = await getClientManifest();

    console.log("manifest", manifest);

    const { loading: loadingTemplate } = await import("@nuxt/ui-templates");

    const response: RenderResponse = {
      body: loadingTemplate({ loading: "hello" }),
      statusCode: event.node.res.statusCode,
      statusMessage: event.node.res.statusMessage,
      headers: {
        "content-type": "text/html;charset=utf-8",
        "x-powered-by": "Nuxt",
      },
    };

    return response;
  }
);
