import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { proxy, Shadowsocks } from "../../reducers/proxyReducer";
import { ServerCard } from "./ServerCard";
import { Dialog, ICON_NAME, notifier } from "../Core";
import { encodeSsUrl } from "../../utils/url";
import { clipboard } from "electron";
import { AppState } from "../../reducers/rootReducer";
import { EditShadowsocksDialog } from "../Dialogs/EditShadowsocksDialog";
import QRCode from "qrcode";

type ShadowsocksCardProps = {
  shadowsocks: Shadowsocks;
};

export const ShadowsocksCard = (props: ShadowsocksCardProps) => {
  const { id, name, host, regionCode, port, pingTime } = props.shadowsocks;
  const dispatch = useDispatch();

  const onClick = useCallback(() => dispatch(proxy.actions.setActiveId(id)), [
    dispatch,
    id,
  ]);
  const [isEditing, setIsEditing] = useState(false);
  const activatedId = useSelector<AppState, string>(
    (state) => state.proxy.activeId
  );
  const [isShowQrCode, setIsShowQrCode] = useState(false);
  const isStartedOrProcessing = useSelector<AppState, boolean>(
    (state) => state.proxy.isProcessing || state.proxy.isStarted
  );

  const dropdownItems = useMemo(() => {
    const isActivated = activatedId === id && isStartedOrProcessing;

    return [
      {
        iconName: ICON_NAME.EDIT,
        content: "Edit",
        handleOnClick: () => {
          setIsEditing(true);
        },
        disabled: isActivated,
      },
      {
        iconName: ICON_NAME.COPY,
        content: "Copy Url",
        handleOnClick: async () => {
          const url = encodeSsUrl(props.shadowsocks);
          await clipboard.writeText(url);
          notifier.success("Copy Url successfully");
        },
      },
      {
        iconName: ICON_NAME.QRCODE,
        content: "Share QrCode",
        handleOnClick: async () => {
          setIsShowQrCode(true);
        },
      },

      {
        iconName: ICON_NAME.DELETE,
        isDanger: true,
        content: "Delete",
        handleOnClick: () => {
          dispatch(proxy.actions.delete({ type: "shadowsocks", id }));
        },
        disabled: isActivated,
      },
    ];
  }, [activatedId, dispatch, id, isStartedOrProcessing, props.shadowsocks]);
  const closeEditDialog = useCallback(() => setIsEditing(false), []);
  const closeQrCodeDialog = useCallback(() => setIsShowQrCode(false), []);

  useEffect(() => {
    if (isShowQrCode) {
      const url = encodeSsUrl(props.shadowsocks);
      QRCode.toCanvas(document.getElementById("qr-code"), url).catch((e) => {
        console.log(e);
      });
    }
  }, [isShowQrCode, props.shadowsocks]);

  return (
    <>
      {isShowQrCode && (
        <Dialog close={closeQrCodeDialog}>
          <canvas id="qr-code" />
        </Dialog>
      )}
      {isEditing && (
        <EditShadowsocksDialog
          close={closeEditDialog}
          initialValue={props.shadowsocks}
        />
      )}
      <ServerCard
        id={id}
        type={"shadowsocks"}
        onClick={onClick}
        name={name}
        host={host}
        port={port}
        regionCode={regionCode}
        menuItems={dropdownItems}
        pingTime={pingTime}
      />
    </>
  );
};
