import {
  defineNoyauModule,
  createResolver,
  addTemplate,
  updateTemplates,
} from "@noyau/kit";
import { type NoyauRoute } from "@noyau/schema";
import { source } from "common-tags";
import { generateRouteDefinitions, generateRouter } from "./utils";
import { genImport } from "knitwork";
import { existsSync } from "fs";

// Module options TypeScript interface definition
export interface ModuleOptions {
  rootFile: string;
}

export default defineNoyauModule<ModuleOptions>({
  meta: {
    name: "@noyau/module-tanstack-router",
    configKey: "tanstack-router",
    modules: ["@noyau/module-react", "@noyau/module-routes"],
  },
  // Default configuration options of the Noyau module
  defaults: {
    rootFile: "~/root.tsx",
  },
  setup(options, { noyau }) {
    const resolver = createResolver(import.meta.url);

    noyau.options.alias["#tanstack/router"] = "#build/tanstack/router.tsx";

    noyau.hooks.hook("watch", async (event, path) => {
      if (
        (event === "create" || event === "delete") &&
        path === (await resolver.resolvePath(options.rootFile))
      ) {
        await updateTemplates(
          (template) => template.filename === "#tanstack/router"
        );
      }
    });

    // @ts-expect-error asdf
    noyau.hook("routes:generate", async (routes: NoyauRoute[]) => {
      addTemplate({
        filename: "tanstack/router.tsx",
        write: true,
        async getContents() {
          const hasRootFile = existsSync(
            await resolver.resolvePath(options.rootFile)
          );
          return source`
            ${genImport("@tanstack/router", [
              "Route",
              "lazy",
              "RootRoute",
              "Router",
            ])}
            ${
              hasRootFile
                ? genImport(options.rootFile, {
                    name: "rootComponent",
                  })
                : ""
            }
            const rootRoute = ${
              hasRootFile
                ? "RootRoute.withRouterContext()({component: rootComponent})"
                : "new RootRoute()"
            }
            ${generateRouteDefinitions(routes, "rootRoute")}
            ${generateRouter(routes, "rootRoute")};
          `;
        },
      });
      // TODO: add this back when we can pass ctx to updateTemplates
      await updateTemplates(
        (template) => template.filename === "#tanstack/router"
      );
    });

    noyau.hook("types:prepare", ({ references }) => {
      references.push({
        path: "tanstack/router.tsx",
      });
    });
  },
});
