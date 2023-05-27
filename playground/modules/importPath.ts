import { defineNoyauModule } from "@noyau/kit";

export default defineNoyauModule({
  meta: {
    name: "playground importPath",
    version: "0.0.1",
    configKey: "importPath",
  },
  defaults: {},
  setup() {
    console.log("playground importPath module setup");
  },
});
