export type DeepNotNullable<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};
export type SelectiveRequired<T, K extends keyof T> = Omit<T, K> &
  DeepNotNullable<Required<Pick<T, K>>>;
