import styles from "./menu.module.css";
import { Icon } from "..";
import classNames from "classnames";
import React, { RefObject } from "react";
import { FixedSizeList as List } from "react-window";

const VIRTUALIZED_ITEM_SIZE = 40;
const VIRTUALIZED_ITEM_WIDTH = 188;
const VIRTUALIZED_ITEM_HEIGHT = 170;

export type MenuItemProps = {
  content?: React.ReactNode;
  iconType?: "iconFont" | "flag";
  iconName?: string;
  handleOnClick?: () => void;
  isDivider?: boolean;
  isDanger?: boolean;
  style?: any;
  disabled?: boolean;
};

type MenuProps = {
  items: MenuItemProps[];
  className?: string;
  isVirtualized?: boolean;
  menuRef?: RefObject<HTMLDivElement>;
};

//TODO: Refactor Menu to improve performance
export const Menu = React.memo((props: MenuProps) => {
  const { items, className, isVirtualized, menuRef } = props;
  return (
    <div className={classNames(styles.container, className)} ref={menuRef}>
      {isVirtualized ? (
        <List
          itemCount={items.length}
          itemSize={VIRTUALIZED_ITEM_SIZE}
          width={VIRTUALIZED_ITEM_WIDTH}
          height={VIRTUALIZED_ITEM_HEIGHT}
          className={styles.list}
          itemData={items}
        >
          {VirtualizedItem}
        </List>
      ) : (
        <div className={styles.list}>
          {items.map((itemProps, index) => (
            <Item {...itemProps} key={index} />
          ))}
        </div>
      )}
    </div>
  );
});

const VirtualizedItem = React.memo(
  (props: { data: MenuItemProps[]; index: number; style: any }) => (
    <Item {...props.data[props.index]} style={props.style} />
  )
);

const Item = React.memo((props: MenuItemProps) => {
  const {
    handleOnClick,
    iconType = "iconFont",
    iconName,
    isDivider = false,
    content,
    isDanger,
    style,
    disabled,
  } = props;

  return (
    <div
      style={style}
      className={classNames(styles.item, {
        [styles.danger]: isDanger,
        [styles.disabled]: disabled,
      })}
      onClick={handleOnClick}
    >
      {isDivider && <div className={styles.divider} />}
      <div className={styles.content}>
        {iconName && <Icon iconName={iconName} type={iconType} />}
        <div className={styles.text}>{content}</div>
      </div>
    </div>
  );
});
