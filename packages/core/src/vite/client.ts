import {
  mergeConfig,
  type InlineConfig as ViteInlineConfig,
  createServer as createViteServer,
} from "vite";
import { type ViteBuildContext } from ".";
import { joinURL } from "ufo";
import { resolve } from "pathe";
import { defineEventHandler } from "h3";
import { type IncomingMessage, type ServerResponse } from "node:http";
import { viteNodePlugin } from "./vite-node";

export const buildClient = async (ctx: ViteBuildContext) => {
  const clientConfig: ViteUserConfig = mergeConfig(ctx.config, {
    logLevel: "info",
    base: ctx.noyau.options.dev
      ? joinURL(
          ctx.noyau.options.app.baseURL.replace(/^\.\//, "/") || "/",
          ctx.noyau.options.app.buildAssetsDir
        )
      : "./",
    define: {
      "import.meta.server": false,
      "import.meta.client": true,
    },
    optimizeDeps: {
      entries: [ctx.entry],
    },
    resolve: {
      alias: {
        // "#build/plugins": resolve(ctx.noyau.options.buildDir, "plugins/client"),
        "#internal/nitro": resolve(
          ctx.noyau.options.buildDir,
          "nitro.client.mjs"
        ),
      },
    },
    cacheDir: resolve(
      ctx.noyau.options.rootDir,
      "node_modules/.cache/vite",
      "client"
    ),
    build: {
      manifest: true,
      outDir: resolve(ctx.noyau.options.buildDir, "dist/client"),
      rollupOptions: {
        input: { entry: ctx.entry },
      },
    },
    plugins: [viteNodePlugin(ctx)],
    appType: "custom",
    server: {
      middlewareMode: true,
    },
  } satisfies ViteInlineConfig);

  if (ctx.noyau.options.dev) {
    const viteServer = await createViteServer(clientConfig);
    ctx.clientServer = viteServer;
    await ctx.noyau.callHook("vite:serverCreated", viteServer, {
      isClient: true,
      isServer: false,
    });
    const transformHandler = viteServer.middlewares.stack.findIndex(
      (m) =>
        m.handle instanceof Function &&
        m.handle.name === "viteTransformMiddleware"
    );
    viteServer.middlewares.stack.splice(transformHandler, 0, {
      route: "",
      handle: (
        req: IncomingMessage & { _skip_transform?: boolean },
        res: ServerResponse,
        next: (err?: any) => void
      ) => {
        // 'Skip' the transform middleware
        if (req._skip_transform) {
          req.url = joinURL("/__skip_vite", req.url!);
        }
        next();
      },
    });

    const viteMiddleware = defineEventHandler(async (event) => {
      // Workaround: vite devmiddleware modifies req.url
      const originalURL = event.node.req.url!;

      const viteRoutes = viteServer.middlewares.stack
        .map((m) => m.route)
        .filter((r) => r.length > 1);
      if (
        !originalURL.startsWith(clientConfig.base!) &&
        !viteRoutes.some((route) => originalURL.startsWith(route))
      ) {
        // @ts-expect-error _skip_transform is a private property
        event.node.req._skip_transform = true;
      }

      await new Promise((resolve, reject) => {
        viteServer.middlewares.handle(
          event.node.req,
          event.node.res,
          (err: Error) => {
            event.node.req.url = originalURL;
            return err ? reject(err) : resolve(null);
          }
        );
      });
    });
    await ctx.noyau.callHook("server:devHandler", viteMiddleware);

    ctx.noyau.hook("close", async () => {
      await viteServer.close();
    });
  }
};
