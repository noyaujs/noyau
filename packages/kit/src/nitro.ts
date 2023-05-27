import type { Nitro, NitroDevEventHandler, NitroEventHandler } from "nitropack";
import { normalize } from "pathe";
import { useNoyau } from "./context";

function setServerRenderer(handler: string) {
  const noyau = useNoyau();
  noyau.options.nitro.serverRenderer = nitro.serverRenderer;
}

/**
 * normalize handler object
 *
 */
function normalizeHandlerMethod(handler: NitroEventHandler) {
  // retrieve method from handler file name
  const [, method = undefined] =
    handler.handler.match(
      /\.(get|head|patch|post|put|delete|connect|options|trace)(\.\w+)*$/
    ) || [];
  return {
    method,
    ...handler,
    handler: normalize(handler.handler),
  };
}

/**
 * Adds a nitro server handler
 *
 */
export function addServerHandler(handler: NitroEventHandler) {
  useNoyau().options.serverHandlers.push(normalizeHandlerMethod(handler));
}

/**
 * Adds a nitro server handler for development-only
 *
 */
export function addDevServerHandler(handler: NitroDevEventHandler) {
  useNoyau().options.devServerHandlers.push(handler);
}

/**
 * Adds a Nitro plugin
 */
export function addServerPlugin(plugin: string) {
  const noyau = useNoyau();
  noyau.options.nitro.plugins = noyau.options.nitro.plugins || [];
  noyau.options.nitro.plugins.push(normalize(plugin));
}

/**
 * Adds routes to be prerendered
 */
export function addPrerenderRoutes(routes: string | string[]) {
  const noyau = useNoyau();
  if (!Array.isArray(routes)) {
    routes = [routes];
  }
  routes = routes.filter(Boolean);
  if (!routes.length) {
    return;
  }
  noyau.hook("prerender:routes", (ctx) => {
    for (const route of routes) {
      ctx.routes.add(route);
    }
  });
}

/**
 * Access to the Nitro instance
 *
 * **Note:** You can call `useNitro()` only after `ready` hook.
 *
 * **Note:** Changes to the Nitro instance configuration are not applied.
 *
 * @example
 *
 * ```ts
 * noyau.hook('ready', () => {
 *   console.log(useNitro())
 * })
 * ```
 */
export function useNitro(): Nitro {
  const noyau = useNuxt();
  if (!(noyau as any)._nitro) {
    throw new Error(
      "Nitro is not initialized yet. You can call `useNitro()` only after `ready` hook."
    );
  }
  return (noyau as any)._nitro;
}
