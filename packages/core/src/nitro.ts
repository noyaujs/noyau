import type { Noyau } from "@noyau/schema";
import { dynamicEventHandler } from "h3";
import { type Nitro, type NitroConfig, build } from "nitropack";
import { createDevServer } from "nitropack";
import { createNitro } from "nitropack";
import { join, resolve } from "pathe";
import { distDir } from "./dirs";

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
    renderer:
      noyau.options.nitro.renderer ||
      resolve(distDir, "runtime/nitro/defaultRenderer"),
    baseURL: noyau.options.app.baseURL,
    runtimeConfig: {
      ...noyau.options.runtimeConfig,
      nitro: {
        envPrefix: "NOYAU_",
      },
    },
    imports: {
      imports: [
        {
          as: "__buildAssetsURL",
          name: "buildAssetsURL",
          from: resolve(distDir, "runtime/nitro/paths"),
        },
        {
          as: "__publicAssetsURL",
          name: "publicAssetsURL",
          from: resolve(distDir, "runtime/nitro/paths"),
        },
      ],
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
      "#noyau/paths": resolve(distDir, "runtime/nitro/paths"),
      "#noyau/renderer": resolve(distDir, "runtime/nitro/renderer"),
      ...noyau.options.alias,
    },
    externals: {
      inline: [
        ...(noyau.options.dev ? [] : ["@noyau/", noyau.options.buildDir]),
        distDir,
      ],
    },
    plugins: noyau.options.nitro.plugins,
    rollupConfig: {
      output: {},
      plugins: [],
    },
  };

  // Init nitro
  const nitro = await createNitro(nitroConfig);

  // Connect vfs storages
  nitro.vfs = noyau.vfs = nitro.vfs || noyau.vfs || {};
  noyau.hook("close", () => nitro.hooks.callHook("close"));

  // Expose nitro to modules and kit
  noyau._nitro = nitro;

  // Setup handlers
  const devMiddlewareHandler = dynamicEventHandler();
  nitro.options.devHandlers.unshift({ handler: devMiddlewareHandler });

  // nuxt build/dev
  noyau.hook("build:done", async () => {
    // await nuxt.callHook("nitro:build:before", nitro);
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

    noyau.hook("server:devHandler", (h) => {
      devMiddlewareHandler.set(h);
    });
    noyau.server = createDevServer(nitro);

    const waitUntilCompile = new Promise<void>((resolve) =>
      nitro.hooks.hook("compiled", () => resolve())
    );

    noyau.hook("build:done", () => waitUntilCompile);
  }
};
