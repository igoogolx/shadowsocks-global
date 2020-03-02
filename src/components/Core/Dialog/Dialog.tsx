import React, { useCallback, useRef } from "react";
import styles from "./dialog.module.css";
import { createPortal } from "react-dom";
import classNames from "classnames";
import { useLockBodyScroll } from "../../../hooks";
import { Button, Icon, ICON_NAME } from "../index";
type DialogProps = {
  children: React.ReactNode;
  disabled?: boolean;
  close: () => void;
};

export const Dialog = React.memo((props: DialogProps) => {
  const { close, children, disabled } = props;
  const contentRef = useRef<HTMLDivElement>(null);
  const disabledClose = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (e.target === e.currentTarget) close();
    },
    [close, disabled]
  );

  const cls = classNames(styles.container, {
    [styles.disabled]: disabled
  });
  useLockBodyScroll();
  return createPortal(
    <div>
      <div className={styles.mask} />
      <div className={cls} onClick={disabledClose}>
        <div className={styles.content}>
          <Button className={styles.close}>
            <Icon iconName={ICON_NAME.CLOSE} />
          </Button>
          <div className={styles.panel} ref={contentRef}>
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
});
