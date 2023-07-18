import {
  type Nitro,
  type NitroDevEventHandler,
  type NitroEventHandler,
} from "nitropack";
import { normalize } from "pathe";
import { useNoyau } from "./context";

export const setServerRenderer = (handler: string) => {
  const noyau = useNoyau();
  if (noyau.options.nitro.renderer) {
    throw new Error(
      `Nitro renderer is already set to ${noyau.options.nitro.renderer}`
    );
  }
  noyau.options.nitro.renderer = handler;
};

function normalizeHandlerMethod(handler: NitroEventHandler) {
  // retrieve method from handler file name
  const [, method = undefined] =
    handler.handler.match(
      /\.(get|head|patch|post|put|delete|connect|options|trace)(\.\w+)*$/
    ) ?? [];
  return {
    method,
    ...handler,
    handler: normalize(handler.handler),
  };
}

export function addServerHandler(handler: NitroEventHandler) {
  useNoyau().options.serverHandlers.push(normalizeHandlerMethod(handler));
}

export function addDevServerHandler(handler: NitroDevEventHandler) {
  useNoyau().options.devServerHandlers.push(handler);
}

export const addServerPlugin = (plugin: string) => {
  const noyau = useNoyau();
  noyau.options.nitro.plugins = noyau.options.nitro.plugins || [];
  noyau.options.nitro.plugins.push(normalize(plugin));
};

// export function addPrerenderRoutes(routes: string | string[]) {
//   const noyau = useNoyau();
//   if (!Array.isArray(routes)) {
//     routes = [routes];
//   }
//   routes = routes.filter(Boolean);
//   if (!routes.length) {
//     return;
//   }
//   noyau.hook("prerender:routes", (ctx) => {
//     for (const route of routes) {
//       ctx.routes.add(route);
//     }
//   });
// }

export function useNitro(): Nitro {
  const noyau = useNoyau();
  if (!(noyau as any)._nitro) {
    throw new Error(
      "Nitro is not initialized yet. You can call `useNitro()` only after `ready` hook."
    );
  }
  return (noyau as any)._nitro;
}
