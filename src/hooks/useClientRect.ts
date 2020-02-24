import { useCallback, useState } from "react";

export function useClientRect(): [ClientRect | DOMRect, any] {
  const [rect, setRect] = useState<any>({});
  const ref = useCallback((node: HTMLElement) => {
    if (node !== null) {
      setRect(node.getBoundingClientRect());
    }
  }, []);
  return [rect, ref];
}
