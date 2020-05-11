import { useCallback, useEffect, useRef, useState } from "react";

//https://usehooks.com/useAsync/
export const useAsync = (
  asyncFunction: () => Promise<any>,
  immediate = true
) => {
  const isSubscribed = useRef(true);
  const [pending, setPending] = useState(false);
  const [value, setValue] = useState<any>(null);
  const [error, setError] = useState(null);

  // The execute function wraps asyncFunction and
  // handles setting state for pending, value, and error.
  // useCallback ensures the below useEffect is not called
  // on every render, but only if asyncFunction changes.
  const execute = useCallback(async () => {
    setPending(true);
    setValue(null);
    setError(null);
    try {
      const value = await asyncFunction();
      if (isSubscribed.current) setValue(value);
    } catch (e) {
      if (isSubscribed.current) setError(e);
    } finally {
      if (isSubscribed.current) setPending(false);
    }
  }, [asyncFunction]);

  // Call execute if we want to fire it right away.
  // Otherwise execute can be called later, such as
  // in an onClick handler.
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);
  useEffect(() => {
    return () => {
      isSubscribed.current = false;
    };
  }, []);

  return { execute, pending, value, error };
};
