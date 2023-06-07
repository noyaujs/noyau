import { type RuntimeNoyauHooks } from "./hooks";
import { type NoyauApp } from "./noyau";

type PluginFn = (noyau: NoyauApp) => void | Promise<void>;

export type AppPlugin = PluginFn & {
  meta: {
    name: string;
  };
  __noyau_plugin__: true;
};

export type PluginOptions = {
  name: string;
  hooks?: Partial<RuntimeNoyauHooks>;
  setup?: PluginFn;
};
