import { defineNoyauConfig } from "@noyau/kit/config";

export default defineNoyauConfig({
  srcDir: "src",
  modules: [
    "@noyau/module-spa",
    "@noyau/module-react",
    "@noyau/module-tanstack-router",
    "@noyau/module-routes",
  ],
  spa: {
    entry: "~/entry.tsx",
  },
});
