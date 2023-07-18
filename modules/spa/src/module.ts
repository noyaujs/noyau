import {
  defineNoyauModule,
  createResolver,
  setServerRenderer,
} from "@noyau/kit";
import { name, version } from "../package.json";
import {} from "@noyau/schema"; // This is needed so type-gen can infer the default export return type

// Module options TypeScript interface definition
export interface ModuleOptions {}

export default defineNoyauModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey: "spa",
  },
  // Default configuration options of the Nuxt module
  async setup() {
    const resolver = createResolver(import.meta.url);
    setServerRenderer(await resolver.resolvePath("./runtime/renderer"));
  },
});
