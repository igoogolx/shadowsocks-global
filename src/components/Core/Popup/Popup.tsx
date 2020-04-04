import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useLockBodyScroll, useOnClickOutside } from "../../../hooks";
import * as React from "react";
const OFFSET = 4;

export type PopupProps = {
  children: React.ReactNode;
  setIsShow?: (isShow: boolean) => void;
  target: React.RefObject<any>;
  placement:
    | "top-start"
    | "top"
    | "top-end"
    | "bottom-start"
    | "bottom"
    | "bottom-end"
    | "left-start"
    | "left"
    | "left-end"
    | "right-start"
    | "right"
    | "right-end";
};

export const Popup = (props: PopupProps) => {
  const { children, setIsShow, target, placement } = props;
  const [targetRect, setTargetRect] = useState({
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    height: 0,
    width: 0,
  });

  useLayoutEffect(() => {
    if (target.current) setTargetRect(target.current.getBoundingClientRect());
  }, [target]);
  const popupRef = useRef<HTMLDivElement>(null);
  useLockBodyScroll();

  const closePopup = useCallback(() => {
    setIsShow && setIsShow(false);
  }, [setIsShow]);

  useOnClickOutside(target, closePopup);

  const popupPosition = {
    top: 0,
    left: 0,
  };
  if (target.current && target.current && popupRef.current) {
    const popupRect = popupRef.current.getBoundingClientRect();
    const widthShortage = (targetRect.width - popupRect.width) / 2;
    const heightShortage = (targetRect.height - popupRect.height) / 2;
    switch (placement) {
      case "top-start":
        popupPosition.left = targetRect.left;
        popupPosition.top = targetRect.top - OFFSET - popupRect.height;
        break;
      case "top":
        popupPosition.left = targetRect.left + widthShortage;
        popupPosition.top = targetRect.top - OFFSET - popupRect.height;
        break;
      case "top-end":
        popupPosition.left = targetRect.right - popupRect.width;
        popupPosition.top = targetRect.top - OFFSET - popupRect.height;
        break;
      case "bottom-start":
        popupPosition.top = targetRect.bottom + OFFSET;
        popupPosition.left = targetRect.left;
        break;
      case "bottom":
        popupPosition.left = targetRect.left + widthShortage;
        popupPosition.top = targetRect.bottom + OFFSET;
        break;
      case "bottom-end":
        popupPosition.top = targetRect.bottom + OFFSET;
        popupPosition.left = targetRect.right - popupRect.width;
        break;
      case "left-start":
        popupPosition.left = targetRect.left - OFFSET - popupRect.width;
        popupPosition.top = targetRect.top;
        break;
      case "left":
        popupPosition.left = targetRect.left - OFFSET - popupRect.width;
        popupPosition.top = targetRect.top + heightShortage;
        break;
      case "left-end":
        popupPosition.left = targetRect.left - OFFSET - popupRect.width;
        popupPosition.top = targetRect.bottom - popupRect.height;
        break;
      case "right-start":
        popupPosition.left = targetRect.right + OFFSET;
        popupPosition.top = targetRect.top;
        break;
      case "right":
        popupPosition.left = targetRect.right + OFFSET;
        popupPosition.top = targetRect.top + heightShortage;
        break;
      case "right-end":
        popupPosition.left = targetRect.right + OFFSET;
        popupPosition.top = targetRect.bottom - popupRect.height;
        break;
      default:
        break;
    }
    if (popupRect.height > window.innerHeight - popupPosition.top)
      popupPosition.top = targetRect.top - OFFSET - popupRect.height;
    if (popupRect.width > window.innerWidth - popupPosition.left)
      popupPosition.left = targetRect.right - popupRect.width;
  }
  return (
    <div
      style={{
        position: "fixed",
        zIndex: 2, //var(--z-index-top)
        ...popupPosition,
      }}
      ref={popupRef}
    >
      {children}
    </div>
  );
};
