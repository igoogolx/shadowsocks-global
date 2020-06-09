import { proxy, Socks5 } from "../../reducers/proxyReducer";
import { ServerCard } from "./ServerCard";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import { ICON_NAME } from "../Core";
import { EditSocks5sDialog } from "../Dialogs/EditSocks5sDialog";
import { lookupRegionCode } from "../../utils/helper";

type Socks5CardProps = {
  socks5: Socks5;
};

export const Socks5Card = React.memo((props: Socks5CardProps) => {
  const { id, host, regionCode, port } = props.socks5;
  const dispatch = useDispatch();
  const onClick = useCallback(() => dispatch(proxy.actions.setActiveId(id)), [
    dispatch,
    id,
  ]);
  const [isEditing, setIsEditing] = useState(false);
  const activatedId = useSelector<AppState, string>(
    (state) => state.proxy.activeId
  );
  const isConnectedOrProcessing = useSelector<AppState, boolean>(
    (state) => state.proxy.isProcessing || state.proxy.isConnected
  );

  const dropdownItems = useMemo(() => {
    const isActivated = activatedId === id && isConnectedOrProcessing;
    return [
      {
        iconName: ICON_NAME.EDIT,
        content: "Edit",
        handleOnClick: () => setIsEditing(true),
        disabled: isActivated,
      },
      {
        iconName: ICON_NAME.DELETE,
        isDanger: true,
        content: "Delete",
        handleOnClick: () => {
          dispatch(proxy.actions.deleteOne({ type: "socks5", id }));
        },
        disabled: isActivated,
      },
    ];
  }, [activatedId, dispatch, id, isConnectedOrProcessing]);

  const closeDialog = useCallback(() => setIsEditing(false), []);
  useEffect(() => {
    if (regionCode === "Auto") {
      lookupRegionCode(host)
        .then((regionCode) => {
          dispatch(
            proxy.actions.update({
              type: "socks5",
              id,
              config: { regionCode },
            })
          );
        })
        .catch((e) => {
          console.log(e);
        });
    }
  }, [dispatch, host, id, regionCode]);
  return (
    <>
      {isEditing && (
        <EditSocks5sDialog close={closeDialog} initialValue={props.socks5} />
      )}
      <ServerCard
        regionCode={regionCode}
        type={"socks5"}
        onClick={onClick}
        host={host}
        port={port}
        id={id}
        menuItems={dropdownItems}
      />
    </>
  );
});
