import fse from "fs-extra";
import { resolve } from "pathe";
import { withTrailingSlash, withoutLeadingSlash } from "ufo";
import escapeRE from "escape-string-regexp";
import { normalizeViteManifest } from "vue-bundle-renderer";
import  { type Manifest } from "vue-bundle-renderer";
import  { type ViteBuildContext } from ".";

export async function writeManifest(ctx: ViteBuildContext, css: string[] = []) {
  // Write client manifest for use in vue-bundle-renderer
  const clientDist = resolve(ctx.noyau.options.buildDir, "dist/client");
  const serverDist = resolve(ctx.noyau.options.buildDir, "dist/server");

  const devClientManifest: Manifest = {
    "@vite/client": {
      isEntry: true,
      file: "@vite/client",
      css,
      module: true,
      resourceType: "script",
    },
    [ctx.entry]: {
      isEntry: true,
      file: ctx.entry,
      module: true,
      resourceType: "script",
    },
  };

  const clientManifest = ctx.noyau.options.dev
    ? devClientManifest
    : ((await fse.readJSON(resolve(clientDist, "manifest.json"))) as Manifest); // TODO: check if this is correct

  const buildAssetsDir = withTrailingSlash(
    withoutLeadingSlash(ctx.noyau.options.app.buildAssetsDir)
  );
  const BASE_RE = new RegExp(`^${escapeRE(buildAssetsDir)}`);

  for (const key in clientManifest) {
    if (clientManifest[key].file) {
      clientManifest[key].file = clientManifest[key].file.replace(BASE_RE, "");
    }
    for (const item of ["css", "assets"] as const) {
      const manifestItem = clientManifest[key][item];
      if (manifestItem) {
        clientManifest[key][item] = manifestItem.map((i: string) =>
          i.replace(BASE_RE, "")
        );
      }
    }
  }

  await fse.mkdirp(serverDist);

  const manifest = normalizeViteManifest(clientManifest);
  // await ctx.noyau.callHook("build:manifest", manifest);

  await fse.writeFile(
    resolve(serverDist, "client.manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8"
  );
  await fse.writeFile(
    resolve(serverDist, "client.manifest.mjs"),
    "export default " + JSON.stringify(manifest, null, 2),
    "utf8"
  );

  if (!ctx.noyau.options.dev) {
    await fse.rm(resolve(clientDist, "manifest.json"), { force: true });
  }
}
