import { type RequestListener } from "node:http";
import { debounce } from "perfect-debounce";
import { loadNoyauConfig } from "@noyau/kit";
import chokidar from "chokidar";
import { relative, resolve } from "pathe";
import consola from "consola";
import { buildNoyau, loadNoyau, writeTypes } from "@noyau/core";
import { type Noyau } from "@noyau/schema";
import { defineCommand } from "./index";

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
    const loadingHandler: RequestListener = (_req, res) => {
      res.setHeader("Content-Type", "text/html; charset=UTF-8");
      res.statusCode = 503; // Service Unavailable
      res.end(
        `<html><body>${loadingMessage}<script>setTimeout(() => window.location.reload(), 1000)</script></body></html>`
      );
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
      try {
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

        await currentNoyau.ready();

        await Promise.all([buildNoyau(currentNoyau), writeTypes(currentNoyau)]);

        if (!currentNoyau.server?.app) {
          throw new Error("No app found");
        }

        currentHandler = toNodeListener(currentNoyau.server.app);
      } catch (err) {
        consola.error(`Cannot ${isRestart ? "restart" : "start"} noyau: `, err);
        currentHandler = undefined;
      }
    };

    const dLoad = debounce(load, 500);
    const watcher = chokidar.watch([rootDir], {
      ignoreInitial: true,
      depth: 0,
    });
    watcher.on("all", (_event, _file) => {
      // consola.log("watcher", err, events);
      const file = relative(rootDir, _file);
      if (RESTART_RE.test(file)) {
        void dLoad(true, `${file} updated`);
      }
    });

    void load(false);

    return "wait" as const;
  },
});

const RESTART_RE = /^noyau\.config\.(js|ts|mjs|cjs)$/;
