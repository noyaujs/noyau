import { defineNoyauConfig } from "@noyau/core/config";
import { defineNoyauModule } from "@noyau/kit";

export default defineNoyauConfig({
  modules: [
    "./modules/importPath.ts",
    defineNoyauModule({
      meta: {
        name: "playground",
        version: "0.0.1",
        configKey: "playground",
      },
      defaults: {},
      setup() {
        console.log("playground module setup");
      },
    }),
  ],
});
