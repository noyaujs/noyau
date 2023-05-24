import { defineUntypedSchema } from "untyped";
import { resolve } from "pathe";
import { isDebug, isDevelopment } from "std-env";

export default defineUntypedSchema({
  rootDir: {
    $resolve: (val) => (typeof val === "string" ? resolve(val) : process.cwd()),
  },
  dev: isDevelopment,
  $schema: {},
});
