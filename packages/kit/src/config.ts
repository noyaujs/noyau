import  { type LoadConfigOptions } from "c12";
import { loadConfig } from "c12";
import { applyDefaults } from "untyped";
import  { type NoyauConfig, type NoyauOptions } from "@noyau/schema";
import { NoyauConfigSchema } from "@noyau/schema";

export type LoadNoyauConfigOptions = LoadConfigOptions<NoyauConfig>;

export const loadNoyauConfig = async (options?: LoadNoyauConfigOptions) => {
  const { config } = await loadConfig<NoyauConfig>({
    name: "noyau",
    configFile: "noyau.config",
    dotenv: true,
    ...options,
  });
  return (await applyDefaults(NoyauConfigSchema, config!)) as NoyauOptions;
};
