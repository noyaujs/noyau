declare module "@pnpm/graph-sequencer" {
  namespace graphSequencer {
    type Graph<T> = Map<T, T[]>;
    type Groups<T> = T[][];

    interface Options<T> {
      graph: Graph<T>;
      groups: Groups<T>;
    }

    interface Result<T> {
      safe: boolean;
      chunks: Groups<T>;
      cycles: Groups<T>;
    }

    type GraphSequencer = <T>(opts: Options<T>) => Result<T>;
  }

  const graphSequencer: graphSequencer.GraphSequencer;
  export = graphSequencer;
}
