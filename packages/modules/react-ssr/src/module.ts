import {
  defineNoyauModule,
  createResolver,
  setServerRenderer,
  setAppEntry,
} from "@noyau/kit";
import { name, version } from "../package.json";
import {} from "@noyau/schema"; // This is needed so type-gen can infer the default export return type

// Module options TypeScript interface definition
export interface ModuleOptions {
  root: string;
}

export default defineNoyauModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey: "react-ssr",
  },
  // Default configuration options of the Noyau module
  defaults: {
    root: "~/root.tsx",
  },
  async setup(options, { noyau, logger }) {
    if (noyau.options.ssr === false) {
      logger.warn(
        "You are using the 'react-ssr' module but SSR is disabled. This module will have no effect."
      );
      return;
    }

    const resolver = createResolver(import.meta.url);

    noyau.options.alias["#react/root"] = options.root;
    setAppEntry(await resolver.resolvePath("./runtime/entry"));
    setServerRenderer(await resolver.resolvePath("./runtime/renderer"));
  },
});
