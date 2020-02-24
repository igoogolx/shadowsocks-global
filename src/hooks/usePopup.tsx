import {
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import ReactDom from "react-dom";
import { useOnClickOutside, useOnWindowSizeChange } from "./index";
import * as React from "react";
import { useLockBodyScroll } from "./useLockBodyScroll";

export const usePopup = (
  component: React.ReactNode
): [
  MutableRefObject<HTMLElement | undefined>,
  Dispatch<SetStateAction<boolean>>
] => {
  const [isShow, setIsShow] = useState(false);
  const target = useRef<HTMLElement>();
  const popupRef = useRef<HTMLDivElement>(null);
  useLockBodyScroll(isShow);

  const closePopup = useCallback(() => {
    //Muse be callback!
    setIsShow(isShow => !isShow);
  }, []);

  useOnClickOutside(target, closePopup, isShow);
  useOnWindowSizeChange(closePopup, isShow);

  //clean up when unmounting.
  useEffect(() => {
    return () => {
      let children = document.getElementById("popup-container")?.children[0];
      if (children && (children as HTMLElement).style.visibility !== "hidden")
        (children as HTMLElement).style.visibility = "hidden";
    };
  }, []);
  useEffect(() => {
    let container = document.getElementById("popup-container");
    if (!container) {
      container = document.createElement("div");
      container.setAttribute("id", "popup-container");
      document.body.prepend(container);
    }
    const fixedRect = {
      left: 0,
      right: 0,
      bottom: 0,
      top: 0
    };
    if (isShow && target.current) {
      let targetRect = target.current.getBoundingClientRect();
      fixedRect.left = targetRect.left;
      fixedRect.top = targetRect.top + targetRect.height;
      fixedRect.bottom = window.innerHeight - targetRect.bottom;
      fixedRect.right = window.innerWidth - targetRect.right;
      if (popupRef.current) {
        const popupRect = popupRef.current.getBoundingClientRect();
        if (popupRect.height > fixedRect.bottom)
          fixedRect.top = fixedRect.top - popupRect.height - targetRect.height;
        if (popupRect.width > fixedRect.right)
          fixedRect.left = fixedRect.left - popupRect.width;
      }
    }
    ReactDom.render(
      <div
        style={{
          position: "fixed",
          top: fixedRect.top,
          left: fixedRect.left,
          zIndex: 2, //var(--z-index-top)
          //Can't be display,because the height is 0 when display is node.
          visibility: isShow ? "visible" : "hidden"
        }}
        ref={popupRef}
      >
        {component}
      </div>,
      container
    );
  }, [isShow, popupRef, component]);

  return [target, setIsShow];
};
