import { defineNoyauConfig } from "@noyau/kit/config";

export default defineNoyauConfig({
  modules: ["@noyau/module-spa", "@noyau/module-react"],
  // @ts-expect-error noyau doesn't generate types for modules just yet
  spa: {
    entry: "~/entry.tsx",
  },
});
