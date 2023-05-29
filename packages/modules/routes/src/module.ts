import { defineNoyauModule } from "@noyau/kit";

// Module options TypeScript interface definition
export interface ModuleOptions {}

export default defineNoyauModule<ModuleOptions>({
  meta: {
    name: "@noyau/routes",
    configKey: "routes",
  },
  // Default configuration options of the Noyau module
  defaults: {},
  async setup(options, noyau) {
    console.log("Hello from @noyau/routes!");
  },
});
