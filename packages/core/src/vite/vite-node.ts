// The MIT License (MIT)

// Copyright (c) 2016-present - Nuxt Team

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
import { pathToFileURL } from "node:url";
import {
  createApp,
  createError,
  defineEventHandler,
  defineLazyEventHandler,
  eventHandler,
  toNodeListener,
} from "h3";
import { ViteNodeServer } from "vite-node/server";
import fse from "fs-extra";
import { isAbsolute, normalize, resolve } from "pathe";
import { isFileServingAllowed } from "vite";
import type { ModuleNode, Plugin as VitePlugin } from "vite";
import { resolve as resolveModule } from "mlly";
import { distDir } from "../dirs";
import type { ViteBuildContext } from ".";
import { isCSS } from "./utils";
import { createIsExternal } from "./utils/external";
import { normalizeViteManifest } from "vue-bundle-renderer";
// import { transpile } from "./utils/transpile";

// TODO: Remove this in favor of registerViteNodeMiddleware
// after Nitropack or h3 fixed for adding middlewares after setup
export function viteNodePlugin(ctx: ViteBuildContext): VitePlugin {
  // Store the invalidates for the next rendering
  const invalidates = new Set<string>();

  function markInvalidate(mod: ModuleNode) {
    if (!mod.id) {
      return;
    }
    if (invalidates.has(mod.id)) {
      return;
    }
    invalidates.add(mod.id);
    markInvalidates(mod.importers);
  }

  function markInvalidates(mods?: ModuleNode[] | Set<ModuleNode>) {
    if (!mods) {
      return;
    }
    for (const mod of mods) {
      markInvalidate(mod);
    }
  }

  return {
    name: "noyau:vite-node-server",
    enforce: "post",
    configureServer(server) {
      function invalidateVirtualModules() {
        for (const [id, mod] of server.moduleGraph.idToModuleMap) {
          if (id.startsWith("virtual:")) {
            markInvalidate(mod);
          }
        }
        // for (const plugin of ctx.noyau.options.plugins) {
        //   markInvalidates(
        //     server.moduleGraph.getModulesByFile(
        //       typeof plugin === "string" ? plugin : plugin.src
        //     )
        //   );
        // }
        // for (const template of ctx.noyau.options.build.templates) {
        //   markInvalidates(server.moduleGraph.getModulesByFile(template?.src));
        // }
      }

      server.middlewares.use(
        "/__noyau_vite_node__",
        toNodeListener(createViteNodeApp(ctx, invalidates))
      );

      // Invalidate all virtual modules when templates are regenerated
      // ctx.noyau.hook("app:templatesGenerated", () => {
      //   invalidateVirtualModules();
      // });

      server.watcher.on("all", (event, file) => {
        markInvalidates(server.moduleGraph.getModulesByFile(normalize(file)));
        // Invalidate all virtual modules when a file is added or removed
        if (event === "add" || event === "unlink") {
          invalidateVirtualModules();
        }
      });
    },
  };
}

// export function registerViteNodeMiddleware(ctx: ViteBuildContext) {
//   addDevServerHandler({
//     route: "/__nuxt_vite_node__/",
//     handler: createViteNodeApp(ctx).handler,
//   });
// }

function getManifest(ctx: ViteBuildContext) {
  const css = Array.from(
    ctx.ssrServer!.moduleGraph.urlToModuleMap.keys()
  ).filter((i) => isCSS(i));

  const manifest = normalizeViteManifest({
    "@vite/client": {
      file: "@vite/client",
      css,
      module: true,
      isEntry: true,
      resourceType: "script",
    },
    [ctx.entry]: {
      file: ctx.entry,
      isEntry: true,
      module: true,
      resourceType: "script",
    },
  });

  return manifest;
}

function createViteNodeApp(
  ctx: ViteBuildContext,
  invalidates: Set<string> = new Set()
) {
  const app = createApp();

  app.use(
    "/manifest",
    defineEventHandler(() => {
      const manifest = getManifest(ctx);
      return manifest;
    })
  );

  app.use(
    "/invalidates",
    defineEventHandler(() => {
      const ids = Array.from(invalidates);
      invalidates.clear();
      return ids;
    })
  );

  app.use(
    "/module",
    defineLazyEventHandler(() => {
      const viteServer = ctx.ssrServer!;
      const node: ViteNodeServer = new ViteNodeServer(viteServer, {
        deps: {
          inline: [
            /\/(noyau|noyau3)\//, // TODO: check why nuxt3 was checked here
            /^#/,
            // ...transpile({ isServer: true, isDev: ctx.noyau.options.dev }),
          ],
        },
        transformMode: {
          ssr: [/.*/],
          web: [],
        },
      });
      const isExternal = createIsExternal(
        viteServer,
        ctx.noyau.options.rootDir
      );
      node.shouldExternalize = async (id: string) => {
        const result = await isExternal(id);
        if (result?.external) {
          return resolveModule(result.id, {
            url: ctx.noyau.options.modulesDir,
          });
        }
        return false;
      };

      return eventHandler(async (event) => {
        const moduleId = decodeURI(event.node.req.url!).substring(1);
        if (moduleId === "/") {
          throw createError({ statusCode: 400 });
        }
        if (
          isAbsolute(moduleId) &&
          !isFileServingAllowed(moduleId, viteServer)
        ) {
          throw createError({ statusCode: 403 /* Restricted */ });
        }
        const module = await node.fetchModule(moduleId).catch((err) => {
          const errorData = {
            code: "VITE_ERROR",
            id: moduleId,
            stack: "",
            ...err,
          };
          throw createError({ data: errorData });
        });
        return module;
      });
    })
  );

  return app;
}

export async function initViteNodeServer(ctx: ViteBuildContext) {
  // Serialize and pass vite-node runtime options
  const viteNodeServerOptions = {
    baseURL: `${ctx.noyau.options.devServer.url}/__noyau_vite_node__`,
    root: ctx.noyau.options.srcDir,
    entryPath: ctx.entry,
    base: ctx.ssrServer!.config.base || "/noyau/",
  };
  process.env.NOYAU_VITE_NODE_OPTIONS = JSON.stringify(viteNodeServerOptions);

  const serverResolvedPath = resolve(distDir, "runtime/vite/vite-node.mjs");
  const manifestResolvedPath = resolve(
    distDir,
    "runtime/vite/client.manifest.mjs"
  );

  await fse.writeFile(
    resolve(ctx.noyau.options.buildDir, "dist/server/server.mjs"),
    `export { default } from ${JSON.stringify(
      pathToFileURL(serverResolvedPath).href
    )}`
  );
  await fse.writeFile(
    resolve(ctx.noyau.options.buildDir, "dist/server/client.manifest.mjs"),
    `export { default } from ${JSON.stringify(
      pathToFileURL(manifestResolvedPath).href
    )}`
  );
}
