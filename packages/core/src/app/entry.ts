import { type AppPlugin } from "@noyau/schema";
import { createNoyauApp, installPlugins } from "./noyau";
import appEntry from "#entry";
import plugins from "#build/plugins";

let entry;

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
if (!import.meta.env.SSR) {
  // eslint-disable-next-line prefer-const
  let entryPromise: Promise<unknown>;

  entry = async () => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    if (entryPromise) {
      return entryPromise;
    }
    const noyau = createNoyauApp();
    console.log(plugins);
    // TODO: plugins
    await installPlugins(noyau, plugins as AppPlugin[]);

    await appEntry(noyau);
  };

  entryPromise = entry().catch((err: unknown) => {
    console.error(`Error while running app entry: ${err}`);
  });
}
