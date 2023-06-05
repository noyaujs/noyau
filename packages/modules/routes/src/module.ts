import { defineNoyauModule } from "@noyau/kit";
import { existsSync, lstatSync } from "node:fs";
import { resolveRoutes } from "./utils";
import { logger } from "./logger";
import { debounce } from "perfect-debounce";
import { resolve } from "pathe";
import { name, version } from "../package.json";
import { type NoyauRoute } from "@noyau/schema";

// Module options TypeScript interface definition
export interface ModuleOptions {
  routesDir: string;
}

export interface ModuleHooks {
  "routes:generate": (routes: NoyauRoute[]) => Promise<void> | void;
}

export default defineNoyauModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey: "routes",
  },
  // Default configuration options of the Noyau module
  defaults: {
    routesDir: "routes",
  },
  async setup(options, { noyau }) {
    const routesDir = resolve(noyau.options.srcDir, options.routesDir);

    const checkRoutesDir = (notifyNew = false) => {
      if (!existsSync(routesDir)) {
        logger.warn(
          `No \`${options.routesDir}\` directory found in ${noyau.options.srcDir}.`
        );
        return false;
      }
      if (lstatSync(routesDir).isFile()) {
        logger.error(
          `Found \`${options.routesDir}\` file but expected directory in ${noyau.options.srcDir}.`
        );
        return false;
      }

      if (notifyNew) {
        logger.success(
          `Found \`${options.routesDir}\` directory in ${noyau.options.srcDir}.`
        );
      }

      return true;
    };

    let hasRouteDir = checkRoutesDir();
    noyau.hooks.hook("watch", (event, path) => {
      let newHasRouteDir = hasRouteDir;
      if ((event === "create" || event === "delete") && path === routesDir) {
        newHasRouteDir = existsSync(routesDir);
        if (hasRouteDir !== newHasRouteDir) {
          hasRouteDir = checkRoutesDir(true);
        }
      }
    });

    // const noyauRoutesFileName = addTemplate({
    //   filename: "noyau/routes.ts",
    //   write: true,
    //   async getContents(ctx) {
    //     const routes = await resolveRoutes(ctx.noyau, routesDir);
    //     return [
    //       `const routes = ${JSON.stringify(routes, undefined, 2)};`,
    //       `export default routes;`,
    //     ].join("\n");
    //   },
    // }).filename;

    const debouncedUpdateTemplates = debounce(async () =>
      //@ts-expect-error module code-gen for routes is not implemented yet
      noyau.callHook("routes:generate", await resolveRoutes(noyau, routesDir))
    );
    // TODO: move this to module:done hook
    noyau.hooks.hookOnce("modules:installed", async () => {
      await debouncedUpdateTemplates();
    });
    noyau.hook("watch", async (event, path) => {
      if (event === "create" || event === "delete") {
        if (path.startsWith(routesDir + "/")) {
          await debouncedUpdateTemplates();
        }
      }
    });
  },
});
