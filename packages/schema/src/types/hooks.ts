import type { Noyau } from "./noyau";
import type { EventHandler } from "h3";
import type { ViteDevServer } from "vite";

type HookResult = void | Promise<void>;

export type NoyauHooks = {
  ready: (noyau: Noyau) => HookResult;
  close: (noyau: Noyau) => HookResult;
  "build:done": (noyau: Noyau) => HookResult;
  "server:devHandler": (handler: EventHandler) => HookResult;
  "vite:serverCreated": (
    server: ViteDevServer,
    env: { isClient: boolean; isServer: boolean }
  ) => HookResult;
};
