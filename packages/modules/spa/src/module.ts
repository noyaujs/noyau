import {
  defineNoyauModule,
  createResolver,
  setServerRenderer,
} from "@noyau/kit";

// Module options TypeScript interface definition
export interface ModuleOptions {}

export default defineNoyauModule<ModuleOptions>({
  meta: {
    name: "my-module",
    configKey: "myModule",
  },
  // Default configuration options of the Nuxt module
  defaults: {},
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);

    setServerRenderer(await resolver.resolvePath("./runtime/renderer"));
  },
});
