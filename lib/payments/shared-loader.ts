// Share initialization across PDP, cart, checkout and nested wallet Elements.
// An unsuccessful load is released so a later mount can retry it.
export function createSharedPaymentLoader<T>(load: (key: string) => Promise<T | null>) {
  const pending = new Map<string, Promise<T | null>>();
  return (key: string): Promise<T | null> => {
    const existing = pending.get(key);
    if (existing) return existing;
    const promise = Promise.resolve().then(() => load(key)).catch(() => null).then(value => {
      if (!value && pending.get(key) === promise) pending.delete(key);
      return value;
    });
    pending.set(key, promise);
    return promise;
  };
}
