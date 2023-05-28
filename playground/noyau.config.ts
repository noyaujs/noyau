import { defineNoyauConfig } from "@noyau/core/config";

export default defineNoyauConfig({
  modules: ["@noyau/module-spa", "@noyau/module-react"],
  spa: {
    entry: "~/entry.tsx",
  },
});
