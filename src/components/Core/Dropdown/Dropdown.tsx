import React, { useCallback, useRef, useState } from "react";
import styles from "./dropdown.module.css";
import classNames from "classnames";
import { Menu } from "..";
import { useLockBodyScroll, useOnClickOutside } from "../../../hooks";
import { MenuItemProps } from "../Menu/Menu";

export type DropdownProps = {
  items: MenuItemProps[];
  showWhenHover?: boolean;
  className?: string;
  menuClassName?: string;
  children: React.ReactNode;
  position?: "left" | "right";
  onChange?: (isOpen: boolean) => void;
  disabled?: boolean;
  isVirtualizedList?: boolean;
};

export const Dropdown = React.memo((props: DropdownProps) => {
  const {
    items,
    showWhenHover,
    className,
    menuClassName,
    children,
    position = "right",
    disabled,
    isVirtualizedList
  } = props;
  const [isOpen, setIsOpen] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(
    targetRef,
    () => {
      setIsOpen(false);
    },
    isOpen
  );
  useLockBodyScroll(isOpen);
  let handleOnClick = useCallback(() => {
    if (showWhenHover || disabled) return;
    setIsOpen(!isOpen);
  }, [disabled, isOpen, showWhenHover]);

  const cls = classNames(styles.container, className);

  const menuCls = classNames(styles.menu, menuClassName, {
    hidden: !isOpen && !showWhenHover,
    [styles.hiddenWhenNotHover]: showWhenHover,
    [styles.right]: position === "right",
    [styles.left]: position === "left"
  });

  return (
    <div className={cls}>
      <div className={styles.content} onClick={handleOnClick} ref={targetRef}>
        {children}
        <Menu
          items={items}
          className={menuCls}
          isVirtualized={isVirtualizedList}
        />
      </div>
    </div>
  );
});
