import { ref, shallowRef, type Ref } from "vue";

interface UseAsyncReturn<T> {
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  data: Ref<T | null>;
  execute: (...args: any[]) => Promise<T | null>;
}

/**
 * 处理异步操作的 Hook
 */
export function useAsync<T>(
  asyncFn: (...args: any[]) => Promise<T>,
  immediate = false
): UseAsyncReturn<T> {
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const data = shallowRef<T | null>(null);

  const execute = async (...args: any[]): Promise<T | null> => {
    loading.value = true;
    error.value = null;

    try {
      const result = await asyncFn(...args);
      data.value = result;
      return result;
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e));
      return null;
    } finally {
      loading.value = false;
    }
  };

  if (immediate) {
    execute();
  }

  return {
    loading,
    error,
    data,
    execute,
  };
}
