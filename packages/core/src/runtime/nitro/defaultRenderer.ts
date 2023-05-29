import { defineRenderHandler } from "#internal/nitro";
import { type RenderResponse } from "nitropack";

export default defineRenderHandler(
  async (event): Promise<Partial<RenderResponse>> => {
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
