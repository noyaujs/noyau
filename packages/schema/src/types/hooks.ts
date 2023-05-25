import type { Noyau } from "./noyau";

type HookResult = void | Promise<void>;

export type NoyauHooks = {
  ready: (noyau: Noyau) => HookResult;
  close: (noyau: Noyau) => HookResult;
  "build:done": (noyau: Noyau) => HookResult;
};
