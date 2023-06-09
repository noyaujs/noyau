import { type Noyau } from "@noyau/schema";
import { dynamicEventHandler } from "h3";
import {
  type Nitro,
  type NitroConfig,
  build,
  scanHandlers,
  writeTypes,
  prepare,
  copyPublicAssets,
  createDevServer,
  createNitro,
} from "nitropack";
import { join, relative, resolve } from "pathe";
import { logger } from "@noyau/kit";
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
        ...noyau.options.build.transpile.filter(
          (i): i is string => typeof i === "string"
        ),
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

  noyau.hook("types:prepare", async (opts) => {
    if (!noyau.options.dev) {
      await scanHandlers(nitro);
      await writeTypes(nitro);
    }
    // Exclude nitro output dir from typescript
    opts.tsConfig.exclude = opts.tsConfig.exclude || [];
    opts.tsConfig.exclude.push(
      relative(
        noyau.options.buildDir,
        resolve(noyau.options.rootDir, nitro.options.output.dir)
      )
    );
    opts.references.push({
      path: resolve(noyau.options.buildDir, "types/nitro.d.ts"),
    });
  });

  noyau.hook("build:done", async () => {
    if (noyau.options.dev) {
      await build(nitro);
    } else {
      await prepare(nitro);
      await copyPublicAssets(nitro);
      logger.restoreAll();
      await build(nitro);
      logger.wrapAll();
    }
  });

  if (noyau.options.dev) {
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
