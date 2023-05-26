import { type Noyau } from "@noyau/schema";
import { existsSync } from "node:fs";
import {
  mergeConfig,
  type UserConfig as ViteUserConfig,
  type ViteDevServer,
} from "vite";
import { buildClient } from "./client";
import { resolve } from "pathe";
import { resolvePath } from "@noyau/kit";

export interface ViteBuildContext {
  noyau: Noyau;
  config: ViteUserConfig;
  entry: string;
  clientServer?: ViteDevServer;
  ssrServer?: ViteDevServer;
}

export const buildNoyau = async (noyau: Noyau) => {
  // TODO: make this configurable
  const entry = await resolvePath(resolve(noyau.options.appDir, "entry"));
  console.log("entry", entry);

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
      resolve: {
        alias: {
          ...noyau.options.alias,
          "#build": noyau.options.buildDir,
        },
      },
      build: {
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
      server: {
        fs: {
          allow: allowDirs,
        },
      },
    },
  };

  await buildClient(ctx);
};
