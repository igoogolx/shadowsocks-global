import { useLayoutEffect } from "react";

export const useLockBodyScroll = () => {
  useLayoutEffect(() => {
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    // left: 37, up: 38, right: 39, down: 40,
    // space: 32, pageup: 33, pagedown: 34, end: 35, home: 36
    const keys = [32, 33, 32, 35, 36, 37, 38, 39, 40];

    function preventScroll(e: any) {
      if (e.target === document) {
        window.scrollTo(scrollX, scrollY);
        return false;
      }
    }

    function preventScrollForScrollKeys(e: any) {
      if (e.target === document && keys.indexOf(e.keyCode) !== -1) {
        window.scrollTo(scrollX, scrollY);
        return false;
      }
    }

    document.addEventListener("scroll", preventScroll);
    document.addEventListener("wheel", preventScroll); // Disable scrolling in Chrome
    document.addEventListener("keydown", preventScrollForScrollKeys);

    return () => {
      document.removeEventListener("scroll", preventScroll);
      document.removeEventListener("wheel", preventScroll); // Enable scrolling in Chrome
      document.removeEventListener("keydown", preventScrollForScrollKeys);
    };
  }, []);
};
