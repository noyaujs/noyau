import { loadNoyauConfig } from "@noyau/kit";
import { defineCommand } from "./index";
import { debounce } from "perfect-debounce";
import type { RequestListener } from "node:http";
import watcher from "@parcel/watcher";
import { relative, resolve } from "pathe";
import consola from "consola";
import { loadNoyau } from "@noyau/core";
import { Noyau } from "@noyau/schema";

export default defineCommand({
  meta: {
    name: "dev",
    usage: "noyau dev [rootDir]",
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

    const rootDir = resolve(args._[0] || ".");

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

    let currentNoyau: Noyau;

    const load = async (isRestart: boolean, reason?: string) => {
      if (isRestart) {
        consola.info(
          `${reason ? reason + ". " : ""}${
            isRestart ? "Restarting" : "Starting"
          } noyau...`
        );
      }

      if (currentNoyau) {
        await currentNoyau.close();
      }

      currentNoyau = await loadNoyau({
        cwd: rootDir,
        overrides: {
          dev: true,
        },
      });

      currentNoyau.hook("ready", async () => {
        consola.log("ready");
      });

      await currentNoyau.ready();
    };

    const dLoad = debounce(load, 500);
    watcher.subscribe(".", (err, events) => {
      consola.log("watcher", err, events);
      for (const event of events) {
        const file = relative(rootDir, event.path);
        if (RESTART_RE.test(file)) {
          dLoad(true, `${file} updated`);
        }
      }
    });

    load(false);

    return "wait" as const;
  },
});

const RESTART_RE = /^noyau\.config\.(js|ts|mjs|cjs)$/;
