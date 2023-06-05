import {
  defineNoyauModule,
  createResolver,
  setServerRenderer,
  setAppEntry,
  useLogger,
} from "@noyau/kit";
import { name, version } from "../package.json";
import { existsSync } from "node:fs";
import {} from "@noyau/schema"; // This is needed so type-gen can infer the default export return type

// Module options TypeScript interface definition
export interface ModuleOptions {
  entry: string;
}

export default defineNoyauModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey: "spa",
  },
  // Default configuration options of the Nuxt module
  defaults: {
    entry: "~/entry.ts",
  },
  async setup(options, { noyau }) {
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
