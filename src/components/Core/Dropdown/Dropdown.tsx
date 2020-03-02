import React, { useCallback, useRef, useState } from "react";
import styles from "./dropdown.module.css";
import classNames from "classnames";
import { Menu } from "..";
import { useOnClickOutside } from "../../../hooks";
import { MenuItemProps } from "../Menu/Menu";
import { Popup } from "../Popup/Popup";

export type DropdownProps = {
  items: MenuItemProps[];
  showWhenHover?: boolean;
  className?: string;
  menuClassName?: string;
  children: React.ReactNode;
  onChange?: (isOpen: boolean) => void;
  disabled?: boolean;
  isVirtualizedList?: boolean;
  isLockBodyScroll?: boolean;
};

export const Dropdown = React.memo((props: DropdownProps) => {
  const {
    items,
    showWhenHover,
    className,
    menuClassName,
    children,
    disabled,
    isVirtualizedList
  } = props;
  const [isOpen, setIsOpen] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => {
    setIsOpen(false);
  }, []);
  useOnClickOutside(targetRef, close);
  let handleOnClick = useCallback(() => {
    if (showWhenHover || disabled) return;
    setIsOpen(!isOpen);
  }, [disabled, isOpen, showWhenHover]);

  const cls = classNames(styles.container, className);

  const menuCls = classNames(styles.menu, menuClassName, {
    [styles.hiddenWhenNotHover]: showWhenHover
  });

  return (
    <div className={cls}>
      <div className={styles.content} onClick={handleOnClick} ref={targetRef}>
        {children}
      </div>
      {isOpen && (
        <Popup setIsShow={setIsOpen} target={targetRef}>
          <Menu
            items={items}
            className={menuCls}
            isVirtualized={isVirtualizedList}
          />
        </Popup>
      )}
    </div>
  );
});
