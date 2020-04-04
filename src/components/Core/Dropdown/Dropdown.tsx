import React, { useCallback, useRef, useState } from "react";
import styles from "./dropdown.module.css";
import classNames from "classnames";
import { Menu } from "..";
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
};

export const Dropdown = React.memo((props: DropdownProps) => {
  const {
    items,
    showWhenHover,
    className,
    menuClassName,
    children,
    disabled,
    isVirtualizedList,
  } = props;
  const [isOpen, setIsOpen] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);

  const handleOnClick = useCallback(() => {
    if (showWhenHover) return;
    setIsOpen(!isOpen);
  }, [isOpen, showWhenHover]);

  const cls = classNames(styles.container, className, {
    [styles.disabled]: disabled,
  });

  const menuCls = classNames(styles.menu, menuClassName, {
    [styles.hiddenWhenNotHover]: showWhenHover,
  });

  return (
    <div className={cls}>
      <div className={styles.content} onClick={handleOnClick} ref={targetRef}>
        {children}
      </div>
      {isOpen && (
        <Popup
          setIsShow={setIsOpen}
          target={targetRef}
          placement={"bottom-start"}
        >
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
