import {
  defineNoyauModule,
  createResolver,
  addVitePlugin,
  addServerPlugin,
} from "@noyau/kit";
import solid from "vite-plugin-solid";
import { name, version } from "../package.json";
import {} from "@noyau/schema"; // This is needed so type-gen can infer the default export return type

// Module options TypeScript interface definition
export interface ModuleOptions {}

export default defineNoyauModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey: "solid",
  },
  // Default configuration options of the Noyau module
  defaults: {},
  setup() {
    // noyau.options.ssr === false; // Force SSR to false
    addVitePlugin(solid(), { prepend: true });
  },
});
