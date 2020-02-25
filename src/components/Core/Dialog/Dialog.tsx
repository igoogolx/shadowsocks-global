import React, { useCallback, useRef } from "react";
import styles from "./dialog.module.css";
import { createPortal } from "react-dom";
import classNames from "classnames";
import { useLockBodyScroll, useOnClickOutside } from "../../../hooks";
import { Button, Icon, ICON_NAME } from "../index";
type DialogProps = {
  isShow: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  close: () => void;
};

export const Dialog = React.memo((props: DialogProps) => {
  const { isShow, close, children, disabled } = props;
  const contentRef = useRef<HTMLDivElement>(null);
  const disabledClose = useCallback(() => {
    if (disabled) return;
    close();
  }, [close, disabled]);
  useOnClickOutside(contentRef, disabledClose, isShow);

  const cls = classNames(styles.container, {
    hidden: !isShow,
    [styles.disabled]: disabled
  });
  useLockBodyScroll(isShow);
  return createPortal(
    <div className={cls}>
      <div className={styles.content}>
        <Button className={styles.close}>
          <Icon iconName={ICON_NAME.CLOSE} />
        </Button>
        <div className={styles.panel} ref={contentRef}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
});
