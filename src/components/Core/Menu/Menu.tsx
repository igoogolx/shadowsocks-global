import styles from "./menu.module.css";
import { BUTTON_SIZE, Button, Icon } from "..";
import classNames from "classnames";
import React from "react";
import { FixedSizeList as List } from "react-window";

export type MenuItemProps = {
  content?: React.ReactNode;
  iconType?: "iconFont" | "flag";
  iconName?: string;
  handleOnClick?: Function;
  isDivider?: boolean;
  isDanger?: boolean;
  style?: any;
};

type MenuProps = {
  items: MenuItemProps[];
  className?: string;
  style?: {
    [key: string]: string | number;
  };
};

export const Menu = React.memo((props: MenuProps) => {
  const { items, className, style } = props;
  return (
    <div className={classNames(styles.container, className)} style={style}>
      {items.length < 20 ? (
        <ul className={styles.list}>
          {items.map((itemProps, index) => (
            <Item {...itemProps} key={index} />
          ))}
        </ul>
      ) : (
        <List
          itemCount={items.length}
          itemSize={35}
          width={188}
          height={150}
          className={styles.list}
          itemData={items}
        >
          {VirtualizedItem}
        </List>
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
    isDanger = false,
    style
  } = props;
  return (
    <div style={style}>
      {isDivider && <li className={styles.divider} />}
      <li
        className={styles.item}
        onClick={() => handleOnClick && handleOnClick()}
      >
        {typeof content !== "string" ? (
          content
        ) : (
          <Button
            size={BUTTON_SIZE.large}
            type={"button"}
            className={isDanger ? styles.danger : ""}
          >
            {iconName && (
              <Icon
                iconName={iconName}
                className={isDanger ? "" : styles.icon}
                type={iconType}
              />
            )}
            <span className={styles.content}>{content}</span>
          </Button>
        )}
      </li>
    </div>
  );
});
