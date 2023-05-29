import { createHooks } from "hookable";
import { version } from "../package.json";
import { loadNoyauConfig, type LoadNoyauConfigOptions } from "@noyau/kit";
import type { NoyauHooks, NoyauOptions, Noyau } from "@noyau/schema";
import { noyauCtx } from "@noyau/kit";
import { initNitro } from "./nitro";
import { resolve } from "pathe";
import { distDir, pkgDir } from "./dirs";
import { bundle } from "./vite";
import { installModule } from "./module/install";
import { watch } from "./watch";

export const buildNoyau = async (noyau: Noyau) => {
  if (noyau.options.dev) {
    await watch(noyau);
  }

  await bundle(noyau);
  await noyau.callHook("build:done", noyau);

  if (!noyau.options.dev) {
    await noyau.callHook("close", noyau);
  }
};

function createNoyau(options: NoyauOptions) {
  const hooks = createHooks<NoyauHooks>();

  const noyau: Noyau = {
    _version: version,
    options,
    hooks,
    callHook: (...args) => hooks.callHook(...args),
    addHooks: (...args) => hooks.addHooks(...args),
    hook: (...args) => hooks.hook(...args),
    ready: () => initNoyau(noyau),
    close: () => Promise.resolve(hooks.callHook("close", noyau)),
    vfs: {},
  };

  return noyau;
}

const initNoyau = async (noyau: Noyau) => {
  noyauCtx.set(noyau);
  noyau.hook("close", () => {
    noyauCtx.unset();
  });

  // add modules
  // await noyau.callHook("modules:before", noyau);
  for (const m of noyau.options.modules) {
    await installModule(m, noyau);
  }
  // await noyau.callHook("modules:done", noyau);

  await initNitro(noyau);

  await noyau.hooks.callHook("ready", noyau);
};

export const loadNoyau = async (options: LoadNoyauConfigOptions) => {
  const config = await loadNoyauConfig(options);

  config.appDir = config.alias["#app"] = resolve(distDir, "app");
  // config.modulesDir.push(resolve(options.workspaceDir, "node_modules"));
  config.modulesDir.push(resolve(pkgDir, "node_modules"));

  return createNoyau(config);
};
