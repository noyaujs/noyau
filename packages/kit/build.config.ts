import { defineBuildConfig } from "unbuild";
export default defineBuildConfig({
  declaration: true,
  entries: [
    {
      input: "src/index",
    },
    {
      input: "config",
    },
  ],
  externals: ["@noyau/schema", "nitropack", "webpack", "vite", "h3"],
});
