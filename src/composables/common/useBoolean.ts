import { ref, type Ref } from "vue";

interface UseBooleanReturn {
  value: Ref<boolean>;
  setTrue: () => void;
  setFalse: () => void;
  toggle: () => void;
  setValue: (val: boolean) => void;
  run: <T>(asyncFn: (...args: any[]) => Promise<T>) => Promise<T | null>;
}

/**
 * 管理布尔状态的 Hook
 */
export function useBoolean(initialValue = false): UseBooleanReturn {
  const value = ref(initialValue);

  const setTrue = () => {
    value.value = true;
  };

  const setFalse = () => {
    value.value = false;
  };

  const toggle = () => {
    value.value = !value.value;
  };

  const setValue = (val: boolean) => {
    value.value = val;
  };

  const run = async <T>(asyncFn: (...args: any[]) => Promise<T>): Promise<T | null> => {
    value.value = true;
    try {
      const result = await asyncFn();
      return result;
    } catch (error) {
      console.error("useBoolean.run error:", error);
      return null;
    } finally {
      value.value = false;
    }
  };

  return {
    value,
    setTrue,
    setFalse,
    toggle,
    setValue,
    run,
  };
}
