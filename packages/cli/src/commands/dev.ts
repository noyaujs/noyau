import { loadNoyauConfig } from "@noyau/kit";
import { defineCommand } from "./index";
import { RequestListener } from "node:http";

export default defineCommand({
  meta: {
    name: "dev",
    usage: "noyau dev",
    description: "Run noyau development server",
  },
  async invoke(args) {
    const { listen } = await import("listhen");
    const { toNodeListener } = await import("h3");
    let currentHandler: RequestListener | undefined;
    const loadingMessage = "Noyau is starting...";
    const loadingHandler: RequestListener = async (_req, res) => {
      const { loading: loadingTemplate } = await import("@nuxt/ui-templates");
      res.setHeader("Content-Type", "text/html; charset=UTF-8");
      res.statusCode = 503; // Service Unavailable
      res.end(loadingTemplate({ loading: loadingMessage }));
    };
    const serverHandler: RequestListener = (req, res) => {
      return currentHandler
        ? currentHandler(req, res)
        : loadingHandler(req, res);
    };

    const config = await loadNoyauConfig({
      overrides: {
        dev: true,
      },
    });

    const listener = await listen(serverHandler, {
      showURL: true,
      open: args.open || args.o,
      port: args.port || args.p || config.devServer.port,
      hostname: args.host || args.h || config.devServer.host,
    });

    return "wait" as const;
  },
});
