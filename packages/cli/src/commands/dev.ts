import { type RequestListener } from "node:http";
import { Argument, Command, Option } from "@commander-js/extra-typings";
import { type Noyau } from "@noyau/schema";

const RESTART_RE = /^noyau\.config\.(js|ts|mjs|cjs)$/;

const devCommand = new Command("dev")
  .description("Start a development server")
  .addArgument(new Argument("[rootDir]", "Root directory").default("."))
  .addOption(new Option("-o, --open", "Open browser"))
  .addOption(new Option("-p, --port <port>", "Port number"))
  .addOption(new Option("-h, --host <host>", "Host name"))
  .action(async (rootDirArg, options) => {
    const { listen } = await import("listhen");
    const { toNodeListener } = await import("h3");
    const consola = (await import("consola")).default;

    const loadingMessage = "Noyau is starting...";
    const loadingHandler: RequestListener = (_req, res) => {
      res.setHeader("Content-Type", "text/html; charset=UTF-8");
      res.statusCode = 503; // Service Unavailable
      res.end(
        `<html><body>${loadingMessage}<script>setTimeout(() => window.location.reload(), 1000)</script></body></html>`
      );
    };

    let currentHandler: RequestListener | undefined;

    const serverHandler: RequestListener = (req, res) => {
      return currentHandler
        ? currentHandler(req, res)
        : loadingHandler(req, res);
    };

    const { resolve, relative } = await import("pathe");

    const rootDir = resolve(rootDirArg);

    const { loadNoyauConfig } = await import("@noyau/kit");

    const config = await loadNoyauConfig({
      overrides: {
        dev: true,
      },
    });

    await listen(serverHandler, {
      showURL: true,
      open: options.open,
      port: options.port ?? config.devServer.port,
      hostname: options.host ?? config.devServer.host,
    });

    let currentNoyau: Noyau;

    const { loadNoyau, buildNoyau, writeTypes } = await import("@noyau/core");
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

    const { debounce } = await import("perfect-debounce");
    const chokidar = await import("chokidar");
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
  });

export default devCommand;
