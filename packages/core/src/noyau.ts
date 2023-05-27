import { createHooks } from "hookable";
import watcher from "@parcel/watcher";
import { version } from "../package.json";
import { loadNoyauConfig, type LoadNoyauConfigOptions } from "@noyau/kit";
import type { NoyauHooks, NoyauOptions, Noyau } from "@noyau/schema";
import { noyauCtx } from "@noyau/kit";
import { initNitro } from "./nitro";
import { resolve } from "pathe";
import { distDir } from "./dirs";
import { bundle } from "./vite";

export const buildNoyau = async (noyau: Noyau) => {
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
  console.log("context", noyauCtx);
  noyauCtx.set(noyau);
  noyau.hook("close", () => {
    noyauCtx.unset();
  });

  await initNitro(noyau);

  await noyau.hooks.callHook("ready", noyau);
};

export const loadNoyau = async (options: LoadNoyauConfigOptions) => {
  const config = await loadNoyauConfig(options);

  config.appDir = config.alias["#app"] = resolve(distDir, "app");

  return createNoyau(config);
};
