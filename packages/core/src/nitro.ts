import type { Noyau } from "@noyau/schema";
import {
  Nitro,
  NitroConfig,
  build,
  copyPublicAssets,
  prepare,
} from "nitropack";
import { createDevServer } from "nitropack";
import { createNitro } from "nitropack";
import { join, resolve } from "pathe";

export const initNitro = async (noyau: Noyau & { _nitro?: Nitro }) => {
  const nitroConfig: NitroConfig = {
    rootDir: noyau.options.rootDir,
    srcDir: resolve(
      noyau.options.rootDir,
      noyau.options.srcDir,
      noyau.options.serverDir
    ),
    dev: noyau.options.dev,
    buildDir: noyau.options.buildDir,
    typescript: {
      strict: true,
      generateTsConfig: true,
      tsconfigPath: "tsconfig.server.json",
    },
    publicAssets: [
      noyau.options.dev
        ? { dir: resolve(noyau.options.buildDir, "dist/client") }
        : {
            dir: join(
              noyau.options.buildDir,
              "dist/client",
              noyau.options.app.buildAssetsDir
            ),
            maxAge: 31536000 /* 1 year */,
            baseURL: noyau.options.app.buildAssetsDir,
          },
    ],
    alias: {
      ...noyau.options.alias,
    },
    rollupConfig: {
      output: {},
      plugins: [],
    },
  };

  // Init nitro
  const nitro = await createNitro(nitroConfig);
  noyau.hook("close", () => nitro.hooks.callHook("close"));

  // Expose nitro to modules and kit
  noyau._nitro = nitro;

  // nuxt build/dev
  noyau.hook("build:done", async () => {
    // await nuxt.callHook("nitro:build:before", nitro);
    console.log("nitro:build:before");
    if (noyau.options.dev) {
      await build(nitro);
    } else {
      throw new Error("Not implemented");
      // await prepare(nitro);
      // await copyPublicAssets(nitro);
      // await nuxt.callHook("nitro:build:public-assets", nitro);
      // await prerender(nitro);
      // if (!nuxt.options._generate) {
      //   logger.restoreAll();
      //   await build(nitro);
      //   logger.wrapAll();
      // } else {
      //   const distDir = resolve(nuxt.options.rootDir, "dist");
      //   if (!existsSync(distDir)) {
      //     await fsp
      //       .symlink(nitro.options.output.publicDir, distDir, "junction")
      //       .catch(() => {});
      //   }
      // }
    }
  });

  if (noyau.options.dev) {
    // nuxt.hook("vite:compiled", () => {
    //   nuxt.server.reload();
    // });

    // nuxt.hook("server:devHandler", (h) => {
    //   devMiddlewareHandler.set(h);
    // });
    noyau.server = createDevServer(nitro);

    const waitUntilCompile = new Promise<void>((resolve) =>
      nitro.hooks.hook("compiled", () => resolve())
    );

    noyau.hook("build:done", () => waitUntilCompile);
  }
};
