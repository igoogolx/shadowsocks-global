import { useCallback, useEffect, useRef, useState } from "react";
import * as React from "react";
import { Popup, PopupProps } from "../Popup/Popup";

type TooltipProps = {
  content: string;
  target: React.RefObject<any>;
} & Pick<PopupProps, "placement">;

export const Tooltip = (props: TooltipProps) => {
  const { content, target, placement = "bottom" } = props;
  const [isShow, setIsShow] = useState(false);
  const [delayHandler, setDelayHandler] = useState<NodeJS.Timeout>();
  const tooltipRef = useRef<HTMLDivElement>(null);

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
    <>
      {isShow && (
        <Popup target={target} placement={placement}>
          <div
            style={{
              color: "white",
              backgroundColor: "rgba(36,36,36,1)",
              fontSize: 14,
              padding: "6px 8px",
              borderRadius: 4,
            }}
            ref={tooltipRef}
          >
            {content}
          </div>
        </Popup>
      )}
    </>
  );
};
