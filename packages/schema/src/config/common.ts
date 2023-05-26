// i really don't like doing this but the types for defineUntypedSchema are simple
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { defineUntypedSchema } from "untyped";
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
  dir: {
    assets: "assets",
    public: {
      $resolve: async (val, get) =>
        val || (await get("dir.static")) || "public",
    },
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
      [".js", ".jsx", ".mjs", ".ts"].concat(val).filter(Boolean),
  },
  ssr: {
    $resolve: (val) => val ?? true,
  },
  $schema: {},
});
