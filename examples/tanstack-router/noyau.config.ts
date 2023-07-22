import { defineNoyauConfig } from "@noyau/kit/config";

export default defineNoyauConfig({
  srcDir: "src",
  modules: [
    "@noyau/module-react", // hmr
    "@noyau/module-spa", // renderer
    "./module-tanstack-router/module.ts", // generate routes with @tanstack/router. note: only components are implemented for now
    "@noyau/module-routes", // standardized filesystem routes
  ],
});
