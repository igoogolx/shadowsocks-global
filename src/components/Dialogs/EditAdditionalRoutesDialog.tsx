import React, { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import { Route, setting } from "../../reducers/settingReducer";
import {
  Button,
  Dialog,
  Field,
  Form,
  Icon,
  ICON_NAME,
  INPUT_SIZE,
  Menu,
  notifier,
} from "../Core";
import { isIPv4 } from "net";
import { FieldToggle } from "../Core/Toggle/Toggle";
import styles from "./dialogs.module.css";
import { MenuItemProps } from "../Core/Menu/Menu";

type EditAdditionalRoutesDialogDialogProps = {
  close: () => void;
};

export const EditAdditionalRoutesDialog = (
  props: EditAdditionalRoutesDialogDialogProps
) => {
  const { close } = props;
  const additionalRoutes = useSelector<AppState, Route[]>(
    (state) => state.setting.rule.additionalRoutes
  );
  const menuItems: MenuItemProps[] = useMemo(
    () =>
      additionalRoutes.map((route) => ({
        content: <RouteItem ip={route.ip} isProxy={route.isProxy} />,
      })),
    [additionalRoutes]
  );
  const dispatch = useDispatch();
  const [route, setRoute] = useState({ ip: "", isProxy: false });
  const [isChanged, setIsChanged] = useState(false);
  const onSubmit = useCallback(
    (data) => {
      if (additionalRoutes.some((route) => route.ip === data.ip))
        notifier.error("The route has exited");
      else {
        dispatch(setting.actions.addAdditionalRoute(data));
        setRoute({ ip: "", isProxy: false });
      }
    },
    [additionalRoutes, dispatch]
  );
  const onChange = useCallback(
    (field: { [key: string]: any }) => {
      setRoute({ ...route, ...field });
      setIsChanged(true);
    },
    [route]
  );

  return (
    <Dialog close={close}>
      <div className={styles.container}>
        <Form onSubmit={onSubmit} onChange={onChange} value={route}>
          <Field
            name={"ip"}
            placeholder={"XXXX.XXXX.XXXX.XXXX"}
            validate={(ip) => isIPv4(ip) || ip.length === 0}
            className={styles.input}
            size={INPUT_SIZE.AUTO}
          />
          <FieldToggle name={"isProxy"}>Proxy this route</FieldToggle>
          <div className={styles.buttonContainer}>
            <Button
              isPrimary={true}
              className={styles.button}
              disabled={!isChanged}
              type={"submit"}
            >
              Save
            </Button>
            <Button isPrimary={true} onClick={close} className={styles.button}>
              Cancel
            </Button>
          </div>
        </Form>
      </div>
      {additionalRoutes.length !== 0 && (
        <>
          <div className={styles.divider} />
          <Menu items={menuItems} className={styles.menu} />
        </>
      )}
    </Dialog>
  );
};

const RouteItem = React.memo((props: Route) => {
  const { ip, isProxy } = props;
  const dispatch = useDispatch();
  const deleteRoute = useCallback(() => {
    dispatch(setting.actions.deleteAdditionalRoute(ip));
  }, [dispatch, ip]);
  return (
    <div className={styles.item}>
      <span>{ip}</span>
      <span className={styles.action}>{isProxy ? "proxy" : "direct"}</span>
      <Button onClick={deleteRoute} className={styles.delete}>
        <Icon iconName={ICON_NAME.DELETE} />
      </Button>
    </div>
  );
});
