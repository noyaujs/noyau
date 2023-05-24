import { defineUntypedSchema } from "untyped";
import { isDebug, isDevelopment } from "std-env";

export default defineUntypedSchema({
  dev: isDevelopment,
});
