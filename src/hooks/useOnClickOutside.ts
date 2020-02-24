import { MutableRefObject, RefObject, useEffect } from "react";

export function useOnClickOutside(
  ref: RefObject<HTMLElement> | MutableRefObject<HTMLElement | undefined>,
  handler: Function,
  flag: boolean
) {
  useEffect(() => {
    const target = ref.current;
    const listener = (event: any) => {
      // Do nothing if clicking ref's element or descendent elements
      if (!target || target.contains(event.target)) {
        return;
      }
      handler(event);
    };
    if (flag) {
      document.addEventListener("click", listener);
    }

    return () => {
      if (flag) {
        document.removeEventListener("click", listener);
      }
    };
  }, [ref, handler, flag]);
}
