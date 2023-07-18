import { type SchemaDefinition } from "untyped";
import { type ConfigSchema } from "../../schema/config";

// look into changing function to something else
// eslint-disable-next-line @typescript-eslint/ban-types
type DeepPartial<T> = T extends Function
  ? T
  : T extends Record<string, any>
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

/** User configuration in `noyau.config` file */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface NoyauConfig
  extends DeepPartial<Omit<ConfigSchema, "vite" | "runtimeConfig">> {
  // // Avoid DeepPartial for vite config interface (https://github.com/nuxt/nuxt/issues/#4772)
  // vite?: ConfigSchema["vite"];
  // TODO: add support for extending schema will probably follow nuxt https://github.com/nuxt/nuxt/issues/15592
  $schema?: SchemaDefinition;
}

export interface NoyauOptions extends ConfigSchema {
  $schema?: SchemaDefinition;
}
