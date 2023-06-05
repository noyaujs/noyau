import { existsSync } from "node:fs";
import { type Noyau } from "@noyau/schema";
import { type UserConfig as ViteUserConfig, type ViteDevServer } from "vite";
import { join, resolve } from "pathe";
import { resolvePath } from "@noyau/kit";
import { withoutLeadingSlash } from "ufo";
import { buildClient } from "./client";
import { buildServer } from "./server";
import { warmupViteServer } from "./utils/warmup";
import virtual from "./plugins/virtual";

export interface ViteBuildContext {
  noyau: Noyau;
  config: ViteUserConfig;
  entry: string;
  clientServer?: ViteDevServer;
  ssrServer?: ViteDevServer;
}

export const bundle = async (noyau: Noyau) => {
  // TODO: make this configurable
  const entry = await resolvePath(
    noyau.options.app.entry || resolve(noyau.options.appDir, "entry")
  );

  let allowDirs = [noyau.options.alias["#app"], noyau.options.rootDir].filter(
    (d) => d && existsSync(d)
  );

  for (const dir of allowDirs) {
    allowDirs = allowDirs.filter((d) => !d.startsWith(dir) || d === dir);
  }

  const ctx: ViteBuildContext = {
    noyau,
    entry,
    config: {
      root: noyau.options.srcDir,
      mode: noyau.options.dev ? "development" : "production",
      resolve: {
        extensions: noyau.options.extensions,
        alias: {
          ...noyau.options.alias,
          "#build": noyau.options.buildDir,
        },
      },
      build: {
        assetsDir: withoutLeadingSlash(noyau.options.app.buildAssetsDir),
        emptyOutDir: false,
        copyPublicDir: false,
        rollupOptions: {
          output: {
            sourcemapIgnoreList: (relativeSourcePath) => {
              return (
                relativeSourcePath.includes("node_modules") ||
                relativeSourcePath.includes(ctx.noyau.options.buildDir)
              );
            },
          },
        },
      },
      plugins: [virtual(noyau.vfs, noyau.options.extensions)],
      server: {
        fs: {
          allow: allowDirs,
        },
      },
    },
  };

  await noyau.callHook("vite:extend", ctx);

  noyau.hook("vite:serverCreated", (server: ViteDevServer, env) => {
    if (
      // https://github.com/nuxt/nuxt/issues/14898
      !env.isServer
    ) {
      const start = Date.now();
      warmupViteServer(server, [join("/@fs/", ctx.entry)], env.isServer)
        .then(() =>
          console.info(
            `Vite ${env.isClient ? "client" : "server"} warmed up in ${
              Date.now() - start
            }ms`
          )
        )
        .catch(console.error);
    }
  });

  noyau.hook("types:prepare", ({ references }) => {
    references.push({
      types: "vite/client",
    });
  });

  await buildClient(ctx);
  await buildServer(ctx);
};
