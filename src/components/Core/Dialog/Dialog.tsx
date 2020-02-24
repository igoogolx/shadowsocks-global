import React, { useRef } from "react";
import styles from "./dialog.module.css";
import { createPortal } from "react-dom";
import classNames from "classnames";
import { DialogHeader } from "./DIalogHeader";
import { DialogFooter } from "./DIalogFooter";
import { useOnClickOutside } from "../../../hooks";
import { useLockBodyScroll } from "../../../hooks/useLockBodyScroll";
import { Button, Icon, ICON_NAME } from "../index";
type DialogProps = {
  isShow: boolean;
  children: React.ReactNode;
  header?: string;
  footer?: React.ReactNode;
  close: () => void;
};

const Dialog = (props: DialogProps) => {
  const { isShow, close, children, header, footer } = props;
  const contentRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(contentRef, close, isShow);
  const cls = classNames(styles.container, {
    hidden: !isShow
  });

  useLockBodyScroll(isShow);
  return createPortal(
    <div className={cls}>
      <div className={styles.content}>
        <Button className={styles.close}>
          <Icon iconName={ICON_NAME.CLOSE} />
        </Button>
        <div className={styles.panel} ref={contentRef}>
          {header && <DialogHeader title={header} />}
          {children}
          {footer && <DialogFooter content={footer} />}
        </div>
      </div>
    </div>,
    document.body
  );
};

const DialogMemo = React.memo(Dialog);

export { DialogMemo as Dialog };
