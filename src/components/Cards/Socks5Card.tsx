import { proxy, Socks5 } from "../../reducers/proxyReducer";
import { ServerCard } from "./ServerCard";
import React, { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import { ICON_NAME } from "../Core";
import { EditSocks5sDialog } from "../Dialogs/EditSocks5sDialog";

type Socks5CardProps = {
  socks5: Socks5;
};

export const Socks5Card = React.memo((props: Socks5CardProps) => {
  const { id, host, regionCode, port } = props.socks5;
  const dispatch = useDispatch();
  const onClick = useCallback(() => dispatch(proxy.actions.setActiveId(id)), [
    dispatch,
    id
  ]);
  const [isEditing, setIsEditing] = useState(false);
  const activatedId = useSelector<AppState, string>(
    state => state.proxy.activeId
  );
  const isStartedOrProcessing = useSelector<AppState, boolean>(
    state => state.proxy.isProcessing || state.proxy.isStarted
  );

  const dropdownItems = useMemo(() => {
    const isActivated = activatedId === id && isStartedOrProcessing;
    return [
      {
        iconName: ICON_NAME.EDIT,
        content: "Edit",
        handleOnClick: () => setIsEditing(true),
        disabled: isActivated
      },
      {
        iconName: ICON_NAME.DELETE,
        isDanger: true,
        content: "Delete",
        handleOnClick: () => {
          dispatch(proxy.actions.delete({ type: "socks5", id }));
        },
        disabled: isActivated
      }
    ];
  }, [activatedId, dispatch, id, isStartedOrProcessing]);

  const closeDialog = useCallback(() => setIsEditing(false), []);

  return (
    <>
      {isEditing && (
        <EditSocks5sDialog close={closeDialog} initialValue={props.socks5} />
      )}
      <ServerCard
        regionCode={regionCode}
        onClick={onClick}
        host={host}
        port={port}
        id={id}
        menuItems={dropdownItems}
      />
    </>
  );
});
