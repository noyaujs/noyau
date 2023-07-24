import { defineNoyauConfig } from "@noyau/kit/config";

export default defineNoyauConfig({
  srcDir: "src",
  modules: [
    "@noyau/module-solid",
    "@noyau/module-routes", // standardized filesystem routes
    "@noyau/module-spa",
    "start/modules", // solid-start modules
  ],
});
