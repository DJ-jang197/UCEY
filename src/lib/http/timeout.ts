export async function withTimeout<T>(
  promiseLike: T,
  ms: number,
  label: string,
): Promise<Awaited<T>> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
  });

  try {
    const operationPromise = Promise.resolve(
      promiseLike as PromiseLike<Awaited<T>>,
    );
    return await Promise.race([operationPromise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
