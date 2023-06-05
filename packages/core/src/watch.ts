import { join } from "path";
import { logger } from "@noyau/kit";
import { type Noyau } from "@noyau/schema";
import { normalize } from "pathe";

export const watch = async (noyau: Noyau) => {
  try {
    await createWatcher(noyau);
  } catch (e) {
    logger.info("failed to load @parcel/watcher, falling back to chokidar");
    if (noyau.options.debug) {
      logger.error(e);
    }
    await createChokidarWatcher(noyau);
  }
};

const createWatcher = async (noyau: Noyau) => {
  const watcher = await import("@parcel/watcher");
  const watch = await watcher.subscribe(
    noyau.options.srcDir,
    (err, events) => {
      if (err) {
        return;
      }
      for (const event of events) {
        // todo checked ignored files
        void noyau.callHook("watch", event.type, normalize(event.path));
      }
    },
    {
      ignore: [".noyau", "node_modules"],
    }
  );

  noyau.hook("close", () => watch.unsubscribe());
};

const eventMap = {
  change: "update",
  unlink: "delete",
  unlinkDir: "delete",
  add: "create",
  addDir: "create",
} as const;

const createChokidarWatcher = async (noyau: Noyau) => {
  const watcher = (await import("chokidar")).watch(noyau.options.srcDir, {
    cwd: noyau.options.srcDir,
    ignoreInitial: true,
    ignored: [".noyau", "node_modules"],
  });

  watcher.on(
    "all",
    (event, path) =>
      void noyau.callHook(
        "watch",
        eventMap[event],
        join(noyau.options.srcDir, normalize(path))
      )
  );
  noyau.hook("close", () => watcher.close());
};
