import { useEffect } from "react";

export const useOnWindowSizeChange = (handler: () => void, flag: boolean) => {
  useEffect(() => {
    if (flag) window.addEventListener("resize", handler);
    return () => {
      if (flag) window.removeEventListener("resize", handler);
    };
  }, [flag, handler]);
};
