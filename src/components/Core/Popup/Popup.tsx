import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useLockBodyScroll, useOnClickOutside } from "../../../hooks";
import * as React from "react";

type PopupProps = {
  children: React.ReactNode;
  setIsShow: (isShow: boolean) => void;
  target: React.RefObject<any>;
};

export const Popup = (props: PopupProps) => {
  const { children, setIsShow, target } = props;
  const [targetRect, setTargetRect] = useState({
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    height: 0,
    width: 0
  });

  useLayoutEffect(() => {
    if (target.current) setTargetRect(target.current.getBoundingClientRect());
  }, [target]);
  const popupRef = useRef<HTMLDivElement>(null);
  useLockBodyScroll();

  const closePopup = useCallback(() => {
    setIsShow(false);
  }, [setIsShow]);

  useOnClickOutside(target, closePopup);

  const fixedRect = {
    left: 0,
    right: 0,
    bottom: 0,
    top: 0
  };
  if (target.current) {
    fixedRect.left = targetRect.left;
    fixedRect.top = targetRect.top + targetRect.height;
    fixedRect.bottom = window.innerHeight - targetRect.bottom;
    fixedRect.right = window.innerWidth - targetRect.right;
    if (popupRef.current) {
      const popupRect = popupRef.current.getBoundingClientRect();
      if (popupRect.height > fixedRect.bottom)
        fixedRect.top = fixedRect.top - popupRect.height - targetRect.height;
      if (popupRect.width > fixedRect.right)
        fixedRect.left = targetRect.right - popupRect.width;
    }
  }
  return (
    <div
      style={{
        position: "fixed",
        top: fixedRect.top,
        left: fixedRect.left,
        zIndex: 2 //var(--z-index-top)
      }}
      ref={popupRef}
    >
      {children}
    </div>
  );
};
