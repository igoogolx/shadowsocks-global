import React, { useCallback, useLayoutEffect, useRef } from "react";
import styles from "./dialog.module.css";
import { createPortal } from "react-dom";
import classNames from "classnames";
import { Button, Icon, ICON_NAME } from "../index";
type DialogProps = {
  children: React.ReactNode;
  disabled?: boolean;
  close?: () => void;
};

export const Dialog = React.memo((props: DialogProps) => {
  const { close, children, disabled } = props;
  const contentRef = useRef<HTMLDivElement>(null);
  const handlerClose = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget && close) close();
    },
    [close]
  );

  const cls = classNames(styles.container, {
    [styles.disabled]: disabled,
  });
  //https://usehooks.com/useLockBodyScroll/
  useLayoutEffect(() => {
    // Get original body overflow
    const originalStyle = window.getComputedStyle(document.body).overflow;
    // Prevent scrolling on mount
    document.body.style.overflow = "hidden";
    // Re-enable scrolling when component unmounts
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []); // Empty array ensures effect is only run on mount and unmount
  return createPortal(
    <div>
      <div className={styles.mask} />
      <div className={cls} onClick={handlerClose}>
        <div className={styles.content}>
          {close && (
            <Button className={styles.close} onClick={close}>
              <Icon iconName={ICON_NAME.CLOSE} />
            </Button>
          )}
          <div className={styles.panel} ref={contentRef}>
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
});
