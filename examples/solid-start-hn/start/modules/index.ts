import { addVitePlugin, createResolver, defineNoyauModule } from "@noyau/kit";

interface ModuleOptions {}

export default defineNoyauModule<ModuleOptions>({
  meta: {
    name: "solid-start/start",
    version: "0.0.1",
    modules: ["@noyau/module-solid", "./start/modules/router"],
  },
  setup(resolvedOptions, { noyau }) {},
  hooks: {
    "types:prepare": ({ references }) => {
      references.push({
        types: "solid-start/env",
      });
    },
  },
});
