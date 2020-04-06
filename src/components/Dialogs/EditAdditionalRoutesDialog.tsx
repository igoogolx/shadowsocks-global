import React, { useCallback, useState } from "react";
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
  notifier,
} from "../Core";
import { isIPv4 } from "net";
import { FieldToggle } from "../Core/Toggle/Toggle";
import styles from "./dialogs.module.css";
import { Table, Cell, Column, Tobody, Thead, Row } from "../Core/Table";

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
  const dispatch = useDispatch();
  const [route, setRoute] = useState({ ip: "", isProxy: false });
  const [isChanged, setIsChanged] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const onSubmit = useCallback(
    (data) => {
      if (additionalRoutes.some((route) => route.ip === data.ip))
        notifier.error("The route has exited");
      else {
        dispatch(setting.actions.addAdditionalRoute(data));
        setRoute({ ip: "", isProxy: false });
        setIsEditing(false);
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

  const onAddClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const closeEditForm = useCallback(() => {
    setIsEditing(false);
  }, []);

  return (
    <Dialog close={close}>
      <Table className={styles.table}>
        <Thead>
          <Column>Ip</Column>
          <Column>Action</Column>
        </Thead>
        <Tobody>
          {additionalRoutes.map((route) => (
            <RouteItem {...route} key={route.ip} />
          ))}
        </Tobody>
      </Table>
      {isEditing ? (
        <Form
          onSubmit={onSubmit}
          onChange={onChange}
          value={route}
          className={styles.editRouteForm}
        >
          <Field
            name={"ip"}
            validate={(ip) => isIPv4(ip) || ip.length === 0}
            className={styles.input}
            size={INPUT_SIZE.AUTO}
          />
          <FieldToggle name={"isProxy"} className={styles.toggle}>
            Proxy
          </FieldToggle>
          <Button
            className={styles.button}
            disabled={!isChanged}
            type={"submit"}
          >
            Save
          </Button>
          <Button onClick={closeEditForm} className={styles.button}>
            Cancel
          </Button>
        </Form>
      ) : (
        <div className={styles.add}>
          <Button onClick={onAddClick}>
            <Icon iconName={ICON_NAME.PLUS} />
          </Button>
        </div>
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
    <Row className={styles.row}>
      <Cell className={styles.cell}>{ip}</Cell>
      <Cell className={styles.cell}>{isProxy ? "proxy" : "direct"}</Cell>
      <Cell className={styles.cell}>
        <Button onClick={deleteRoute} className={styles.delete}>
          <Icon iconName={ICON_NAME.DELETE} />
        </Button>
      </Cell>
    </Row>
  );
});
