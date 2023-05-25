/* eslint-disable @typescript-eslint/no-unsafe-return */
import { defineUntypedSchema } from "untyped";

export default defineUntypedSchema({
  app: {
    baseURL: {
      $resolve: async (val) => val || process.env.NOYAU_APP_BASE_URL || "/",
    },
    buildAssetsDir: {
      $resolve: async (val) =>
        val || process.env.NOYAU_APP_BUILD_ASSETS_DIR || "/_noyau/",
    },
  },
});
