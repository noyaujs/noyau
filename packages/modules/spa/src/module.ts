import {
  defineNoyauModule,
  createResolver,
  setServerRenderer,
  setAppEntry,
  useLogger,
} from "@noyau/kit";
import { existsSync } from "node:fs";

// Module options TypeScript interface definition
export interface ModuleOptions {
  entry: string;
}

export default defineNoyauModule<ModuleOptions>({
  meta: {
    name: "@noyau/spa",
    configKey: "spa",
  },
  // Default configuration options of the Nuxt module
  defaults: {
    entry: "~/entry.ts",
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);
    const logger = useLogger("@noyau/module-spa");
    setServerRenderer(await resolver.resolvePath("./runtime/renderer"));
    if (!existsSync(await resolver.resolvePath(options.entry))) {
      logger.warn(
        `Entry file ${
          options.entry
        } does not exist resolved ${await resolver.resolvePath(options.entry)}`
      );
    }
    setAppEntry(options.entry);
  },
});
