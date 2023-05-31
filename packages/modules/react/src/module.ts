import {
  defineNoyauModule,
  createResolver,
  setServerRenderer,
  setAppEntry,
  addVitePlugin,
  addServerPlugin,
} from "@noyau/kit";
import react from "@vitejs/plugin-react";

// Module options TypeScript interface definition
export interface ModuleOptions {}

export default defineNoyauModule<ModuleOptions>({
  meta: {
    name: "@noyau/react",
    configKey: "react",
  },
  // Default configuration options of the Noyau module
  defaults: {},
  async setup(options, { noyau }) {
    const resolver = createResolver(import.meta.url);
    // noyau.options.ssr === false; // Force SSR to false
    addVitePlugin(
      react({
        jsxRuntime: "automatic",
      }),
      { prepend: true }
    );
    if (noyau.options.dev) {
      addServerPlugin(await resolver.resolvePath("./runtime/fastRefresh.ts"));
    }
  },
});
