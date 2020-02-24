import { useEffect } from "react";

export const useLockBodyScroll = (isLock: boolean) => {
  useEffect(() => {
    const originStyle = window.getComputedStyle(document.body).overflow;
    if (isLock && originStyle !== "hidden") {
      document.body.style.overflow = "hidden";
    } else if (originStyle !== "hidden auto")
      document.body.style.overflow = "hidden auto";
  }, [isLock]);
};
