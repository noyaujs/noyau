import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  declaration: true,
  entries: [
    {
      input: "src/config/index",
      outDir: "schema",
      name: "config",
      builder: "untyped",
      defaults: {
        rootDir: "/<rootDir>/",
        vite: {
          base: "/",
        },
      },
    },
    "src/index",
  ],
  externals: ["h3", "Hookable", "vite"],
});
