import { performance } from "node:perf_hooks";
import { defu } from "defu";
import { applyDefaults } from "untyped";
import type {
  ModuleDefinition,
  ModuleOptions,
  ModuleSetupReturn,
  Noyau,
  NoyauModule,
  NoyauOptions,
} from "@noyau/schema";
import { useNoyau } from "../context";
import { useLogger } from "../logger";
// import { logger } from "../logger";

/**
 * Define a Noyau module, automatically merging defaults with user provided options, installing
 * any hooks that are provided, and calling an optional setup function for full control.
 */
export function defineNoyauModule<OptionsT extends ModuleOptions>(
  definition: ModuleDefinition<OptionsT>
): NoyauModule<OptionsT> {
  // Normalize definition and meta
  if (!definition.meta) {
    definition.meta = {};
  }
  if (definition.meta.configKey === undefined) {
    definition.meta.configKey = definition.meta.name;
  }

  // Resolves module options from inline options, [configKey] in noyau.config, defaults and schema
  async function getOptions(noyau: Noyau = useNoyau()) {
    const configKey = definition.meta!.configKey || definition.meta!.name!;
    const _defaults =
      definition.defaults instanceof Function
        ? definition.defaults(noyau)
        : definition.defaults;
    let _options = defu(
      noyau.options[configKey as keyof NoyauOptions],
      _defaults
    ) as OptionsT;
    if (definition.schema) {
      _options = (await applyDefaults(definition.schema, _options)) as OptionsT;
    }
    return Promise.resolve(_options);
  }

  // Module format is always a simple function
  async function normalizedModule(this: any, noyau: Noyau) {
    // Avoid duplicate installs
    const uniqueKey = definition.meta!.name || definition.meta!.configKey;
    if (uniqueKey) {
      noyau.options._requiredModules = noyau.options._requiredModules || {};
      if (noyau.options._requiredModules[uniqueKey]) {
        return false;
      }
      noyau.options._requiredModules[uniqueKey] = true;
    }

    // Resolve module and options
    const _options = await getOptions(noyau);

    // Register hooks
    if (definition.hooks) {
      noyau.hooks.addHooks(definition.hooks);
    }

    // Call setup
    const key = `noyau:module:${
      uniqueKey || Math.round(Math.random() * 10000)
    }`;
    const mark = performance.mark(key);
    const logger = useLogger(key);
    const res =
      (await definition.setup?.call(undefined, _options, {
        noyau,
        logger,
      })) ?? {};
    const perf = performance.measure(key, mark?.name); // TODO: remove when Node 14 reaches EOL
    const setupTime = perf ? Math.round(perf.duration * 100) / 100 : 0; // TODO: remove when Node 14 reaches EOL

    // Measure setup time
    if (setupTime > 5000) {
      console.warn(
        `Slow module \`${
          uniqueKey || "<no name>"
        }\` took \`${setupTime}ms\` to setup.`
      );
    }
    // else if (noyau.options.debug) {
    //   console.info(
    //     `Module \`${
    //       uniqueKey || "<no name>"
    //     }\` took \`${setupTime}ms\` to setup.`
    //   );
    // }

    // Check if module is ignored
    if (res === false) {
      return false;
    }

    // Return module install result
    return defu(res, <ModuleSetupReturn>{
      timings: {
        setup: setupTime,
      },
    });
  }

  // Define getters for options and meta
  normalizedModule.getMeta = () => Promise.resolve(definition.meta);
  normalizedModule.getOptions = getOptions;

  return normalizedModule as NoyauModule<OptionsT>;
}
