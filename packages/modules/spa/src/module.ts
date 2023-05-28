import {
  defineNoyauModule,
  createResolver,
  setServerRenderer,
  setAppEntry,
} from "@noyau/kit";

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
    entry: "./entry.ts",
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);
    console.log("options", options);
    setServerRenderer(await resolver.resolvePath("./runtime/renderer"));
    setAppEntry(options.entry);
  },
});
