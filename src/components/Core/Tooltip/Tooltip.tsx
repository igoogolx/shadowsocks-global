import { useCallback, useEffect, useRef, useState } from "react";
import * as React from "react";

const OFFSET = 4;

type TooltipProps = {
  content: string;
  target: React.RefObject<any>;
  type?: "top" | "left" | "right" | "bottom";
};

export const Tooltip = (props: TooltipProps) => {
  const { content, target, type = "bottom" } = props;
  const [isShow, setIsShow] = useState(false);
  const [delayHandler, setDelayHandler] = useState<NodeJS.Timeout>();
  const tooltipRef = useRef<HTMLDivElement>(null);

  const absoluteRect = {
    left: 0,
    top: 0
  };
  if (isShow && target.current && tooltipRef.current) {
    const targetRect = target.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const widthShortage = (targetRect.width - tooltipRect.width) / 2;
    const heightShortage = (targetRect.height - tooltipRect.height) / 2;
    absoluteRect.left = targetRect.left + +widthShortage;
    absoluteRect.top = targetRect.top + heightShortage;
    if (type === "top")
      absoluteRect.top = targetRect.top - OFFSET - tooltipRect.height;
    if (type === "bottom") absoluteRect.top = targetRect.bottom + OFFSET;
    if (type === "right") absoluteRect.left = targetRect.right + OFFSET;
    if (type === "left")
      absoluteRect.left = targetRect.left - OFFSET - tooltipRect.width;
  }

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
  }, [enterListener, leaveListener, target]);

  return (
    <div
      style={{
        position: "fixed",
        top: absoluteRect.top,
        left: absoluteRect.left,
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
    </div>
  );
};
