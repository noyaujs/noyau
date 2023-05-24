import { createHooks } from "hookable";
import { version } from "../package.json";
import { loadNoyauConfig, type LoadNoyauConfigOptions } from "@noyau/kit";
import type { NoyauHooks, NoyauOptions, Noyau } from "@noyau/schema";
import { noyauCtx } from "@noyau/kit/src/context";

function createNoyau(options: NoyauOptions) {
  const hooks = createHooks<NoyauHooks>();

  const noyau: Noyau = {
    _version: version,
    options,
    hooks,
    callHook: hooks.callHook,
    addHooks: hooks.addHooks,
    hook: hooks.hook,
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

  await noyau.hooks.callHook("ready", noyau);
};

export const loadNoyau = async (options: LoadNoyauConfigOptions) => {
  const config = await loadNoyauConfig(options);

  return createNoyau(config);
};
