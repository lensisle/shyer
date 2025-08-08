export type UnaryFunction<T, R> = (arg: T) => R;

export default function compose<T>(...fns: Array<UnaryFunction<T, T>>): UnaryFunction<T, T> {
  return (args: T) => fns.reduceRight((val, fn) => fn(val), args);
}


