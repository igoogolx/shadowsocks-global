import React, { useCallback } from "react";
import { Button, Icon, ICON_NAME, ICON_SIZE } from "../index";
import styles from "./checkbox.module.css";
import classNames from "classnames";

type CheckboxProps = {
  checked: boolean;
  onChange: (isChecked: boolean) => void;
  className?: string;
};

export const Checkbox = React.memo((props: CheckboxProps) => {
  const { checked, onChange, className } = props;
  const onClick = useCallback(() => {
    onChange(!checked);
  }, [checked, onChange]);
  return (
    <Button
      onClick={onClick}
      className={classNames(className, styles.container)}
    >
      <Icon
        iconName={checked ? ICON_NAME.CHECK_SQUARE_FILL : ICON_NAME.BORDER}
        size={ICON_SIZE.SIZE24}
      />
    </Button>
  );
});
