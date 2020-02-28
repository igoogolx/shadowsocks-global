import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from "react";
import ReactDom from "react-dom";
import * as React from "react";
import { useClientRect } from "./useClientRect";

const OFFSET = 4;

export const useTooltip = (
  content: string,
  type: "top" | "left" | "right" | "bottom" = "bottom"
) => {
  const [isShow, setIsShow] = useState(false);
  const target = useRef<any>(null);
  const [tooltipRect, tooltipRef] = useClientRect();
  const [delayHandler, setDelayHandler] = useState<NodeJS.Timeout>();
  useLayoutEffect(() => {
    let container = document.getElementById("tooltip-container");
    if (!container) {
      container = document.createElement("div");
      container.setAttribute("id", "tooltip-container");
      document.body.prepend(container);
    }
    const absoluteRect = {
      left: 0,
      top: 0
    };
    if (isShow && target.current && tooltipRect) {
      const targetRect = target.current.getBoundingClientRect();
      const widthShortage = (targetRect.width - tooltipRect.width) / 2;
      const heightShortage = (targetRect.height - tooltipRect.height) / 2;
      absoluteRect.left = targetRect.left + +widthShortage;
      absoluteRect.top = targetRect.top + heightShortage;
      if (type === "top") absoluteRect.top = targetRect.top + OFFSET;
      if (type === "bottom") absoluteRect.top = targetRect.bottom + OFFSET;
      if (type === "right") absoluteRect.left = targetRect.right + OFFSET;
      if (type === "left") absoluteRect.left = targetRect.left + OFFSET;
    }

    ReactDom.render(
      <div
        style={{
          position: "fixed",
          top: absoluteRect.top,
          //TODO:Fix bug: absoluteRect.left may be NaN
          left: absoluteRect.left || 0,
          zIndex: 2, //var(--z-index-top)
          backgroundColor: "rgba(36,36,36,1)",
          color: "white",
          fontSize: 14,
          padding: "6px 8px",
          borderRadius: 4,
          visibility: isShow ? "visible" : "hidden"
        }}
        ref={tooltipRef}
      >
        {content}
      </div>,
      container
    );
  }, [content, isShow, tooltipRect, tooltipRef, type]);

  const enterListener = useCallback(() => {
    setDelayHandler(
      setTimeout(() => {
        setIsShow(true);
      }, 500)
    );
  }, []);
  const leaveListener = useCallback(() => {
    if (delayHandler) clearTimeout(delayHandler);
    setIsShow(false);
  }, [delayHandler]);

  useEffect(() => {
    const targetNode = target.current;
    targetNode?.addEventListener("mouseenter", enterListener);
    targetNode?.addEventListener("mouseleave", leaveListener);
    return () => {
      targetNode?.removeEventListener("mouseenter", enterListener);
      targetNode?.removeEventListener("mouseleave", leaveListener);
    };
  }, [enterListener, leaveListener]);

  return target;
};
