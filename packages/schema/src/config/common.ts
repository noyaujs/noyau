// i really don't like doing this but the types for defineUntypedSchema are simple
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { defineUntypedSchema } from "untyped";
import defu from "defu";
import { join, resolve } from "pathe";
import { isDebug, isDevelopment } from "std-env";

export default defineUntypedSchema({
  rootDir: {
    $resolve: (val) => (typeof val === "string" ? resolve(val) : process.cwd()),
  },
  srcDir: {
    $resolve: async (val, get) => resolve(await get("rootDir"), val || "."),
  },
  dev: isDevelopment,
  serverDir: {
    $resolve: async (val, get) =>
      resolve(
        await get("rootDir"),
        val || resolve(await get("srcDir"), "server")
      ),
  },
  buildDir: {
    $resolve: async (val, get) =>
      resolve(await get("rootDir"), val || ".noyau"),
  },
  modulesDir: {
    $default: ["node_modules"],
    $resolve: async (val, get) => [
      ...(await Promise.all(
        val.map(async (dir: string) => resolve(await get("rootDir"), dir))
      )),
      // resolve(process.cwd(), "node_modules"),
    ],
  },
  dir: {
    assets: "assets",
    public: {
      $resolve: async (val, get) =>
        val || (await get("dir.static")) || "public",
    },
    plugins: "plugins",
  },
  /**
   * @type {(typeof import('../src/types/module').NoyauModule | string)[]}
   */
  modules: {
    $resolve: (val) => [].concat(val).filter(Boolean),
  },
  /**
   * @type {(typeof import('../src/types/noyau').NoyauPlugin | string)[]}
   */
  plugins: {
    $resolve: (val) => [].concat(val).filter(Boolean),
  },
  /** @type {Record<string, string>} */
  alias: {
    $resolve: async (val, get) => ({
      "~": await get("srcDir"),
      "@": await get("srcDir"),
      "~~": await get("rootDir"),
      "@@": await get("rootDir"),
      [await get("dir.assets")]: join(
        await get("srcDir"),
        await get("dir.assets")
      ),
      [await get("dir.public")]: join(
        await get("srcDir"),
        await get("dir.public")
      ),
      ...val,
    }),
  },
  extensions: {
    $resolve: (val) =>
      [".js", ".jsx", ".mjs", ".ts", ".tsx"].concat(val).filter(Boolean),
  },
  ssr: {
    $resolve: (val) => val ?? true,
  },
  runtimeConfig: {
    $resolve: async (val, get) => {
      provideFallbackValues(val);
      return defu(val, {
        public: {},
        app: {
          baseURL: (await get("app")).baseURL,
          buildAssetsDir: (await get("app")).buildAssetsDir,
        },
      });
    },
  },
  debug: false,
  $schema: {},
});

function provideFallbackValues(obj: Record<string, unknown>) {
  for (const key in obj) {
    const value = obj[key];
    if (typeof value === "undefined" || value === null) {
      obj[key] = "";
    } else if (typeof value === "object") {
      provideFallbackValues(value);
    }
  }
}
