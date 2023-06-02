import {
  mergeConfig,
  type InlineConfig as ViteInlineConfig,
  createServer as createViteServer,
  build as viteBuild,
} from "vite";
import { type ViteBuildContext } from ".";
import { resolve } from "pathe";
import { joinURL } from "ufo";
import { writeManifest } from "./manifest";
import { initViteNodeServer } from "./vite-node";
import { logger } from "@noyau/kit";

export const buildServer = async (ctx: ViteBuildContext) => {
  const serverConfig = mergeConfig(ctx.config, {
    base: ctx.noyau.options.dev
      ? joinURL(
          ctx.noyau.options.app.baseURL.replace(/^\.\//, "/") || "/",
          ctx.noyau.options.app.buildAssetsDir
        )
      : undefined,
    define: {
      "import.meta.server": true,
      "import.meta.client": false,
      "typeof window": '"undefined"',
      "typeof document": '"undefined"',
      "typeof navigator": '"undefined"',
      "typeof location": '"undefined"',
      "typeof XMLHttpRequest": '"undefined"',
    },
    ssr: {
      external: ["#internal/nitro", "#internal/nitro/utils"],
      noExternal: [
        /\/esm\/.*\.js$/,
        /\.(es|esm|esm-browser|esm-bundler).js$/,
        "#app",
        /^noyau(\/|$)/,
        /(noyau|noyau3)\/(dist|src|app)/,
      ],
    },
    cacheDir: resolve(
      ctx.noyau.options.rootDir,
      "node_modules/.cache/vite",
      "server"
    ),
    build: {
      outDir: resolve(ctx.noyau.options.buildDir, "dist/server"),
      ssr: true,
      rollupOptions: {
        input: { server: ctx.entry },
        external: ["#internal/nitro"],
        output: {
          entryFileNames: "[name].mjs",
          format: "module",
          generatedCode: {
            constBindings: true,
          },
        },
        onwarn(warning, rollupWarn) {
          if (
            warning.code &&
            ["UNUSED_EXTERNAL_IMPORT"].includes(warning.code)
          ) {
            return;
          }
          rollupWarn(warning);
        },
      },
    },
    server: {
      // https://github.com/vitest-dev/vitest/issues/229#issuecomment-1002685027
      preTransformRequests: false,
      hmr: false,
    },
  } satisfies ViteInlineConfig);

  await ctx.noyau.callHook("vite:extendConfig", serverConfig, {
    isClient: false,
    isServer: true,
  });

  const onBuild = () => ctx.noyau.callHook("vite:compiled");

  if (ctx.noyau.options.dev) {
    await writeManifest(ctx);

    if (!ctx.noyau.options.ssr) {
      await onBuild();
      return;
    }

    // Start development server
    const viteServer = await createViteServer(serverConfig);
    ctx.ssrServer = viteServer;

    await ctx.noyau.callHook("vite:serverCreated", viteServer, {
      isClient: false,
      isServer: true,
    });

    // Close server on exit
    ctx.noyau.hook("close", () => viteServer.close());

    // Initialize plugins
    await viteServer.pluginContainer.buildStart({});

    await initViteNodeServer(ctx);
  } else {
    const start = Date.now();
    logger.info("Building server bundle...");
    logger.restoreAll();
    await viteBuild(serverConfig);
    logger.wrapAll();
    await writeManifest(ctx);
    logger.success(`Server bundle built in ${Date.now() - start}ms`);
    await onBuild();
  }
};
