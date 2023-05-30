import { defineNoyauConfig } from "@noyau/kit/config";

export default defineNoyauConfig({
  srcDir: "src",
  modules: ["@noyau/module-spa", "@noyau/module-react"],
  spa: {
    entry: "~/entry.tsx",
  },
});
