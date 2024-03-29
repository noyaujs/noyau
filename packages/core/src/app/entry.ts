import appEntry from "#entry";

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

    await appEntry();
  };

  entryPromise = entry().catch((err: unknown) => {
    console.error(`Error while running app entry: ${err}`);
  });
} else {
  //TODO: ssr
}

export default () => {};
