import { defineNoyauConfig } from "@noyau/kit/config";

export default defineNoyauConfig({
  srcDir: "src",
  modules: [
    "@noyau/module-spa", // renderer
    "@noyau/module-react", // hmr
    "@noyau/module-tanstack-router", // generate routes with @tanstack/router. note: only components are implemented for now
    "@noyau/module-routes", // standardized filesystem routes
  ],
  spa: {
    entry: "~/entry.tsx",
  },
});
