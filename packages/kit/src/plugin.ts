import { type NoyauPlugin } from "@noyau/schema";
import { normalize } from "pathe";
import { resolveAlias } from "./resolve";
import { useNoyau } from "./context";

export const normalizePlugin = (plugin: NoyauPlugin | string): NoyauPlugin => {
  if (typeof plugin === "string") {
    plugin = { src: plugin };
  }

  if (!plugin.src) {
    throw new Error("Plugin must have a src property");
  }

  plugin.src = normalize(resolveAlias(plugin.src));

  return plugin;
};

export const addPlugin = (plugin: NoyauPlugin | string) => {
  const noyau = useNoyau();

  const normalizedPlugin = normalizePlugin(plugin);

  noyau.options.plugins = noyau.options.plugins.filter(
    (p) => normalizePlugin(p).src !== normalizedPlugin.src
  );

  noyau.options.plugins.push(normalizedPlugin);

  return normalizePlugin;
};
