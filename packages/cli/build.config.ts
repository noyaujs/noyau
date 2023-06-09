import { defineBuildConfig } from "unbuild";
export default defineBuildConfig({
  declaration: true,
  rollup: {
    inlineDependencies: true,
  },
  entries: [
    {
      input: "src/cli",
      outDir: "dist",
    },
  ],
  externals: [
    "@noyau/kit",
    "@noyau/core",
    "@noyau/schema",
    "fsevents",
    "unbuild",
  ],
});
