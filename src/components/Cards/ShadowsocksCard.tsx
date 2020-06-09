import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { proxy, Shadowsocks } from "../../reducers/proxyReducer";
import { ServerCard } from "./ServerCard";
import { Dialog, ICON_NAME, notifier } from "../Core";
import { encodeSsUrl } from "../../utils/url";
import { clipboard } from "electron";
import { AppState } from "../../reducers/rootReducer";
import { EditShadowsocksDialog } from "../Dialogs/EditShadowsocksDialog";
import { ipcRenderer as ipc } from "electron-better-ipc";
import QRCode from "qrcode";

type ShadowsocksCardProps = {
  shadowsocks: Shadowsocks;
};

export const ShadowsocksCard = (props: ShadowsocksCardProps) => {
  const { shadowsocks } = props;
  const { id, name, host, regionCode, port, pingTime } = shadowsocks;
  const dispatch = useDispatch();
  const isConnected = useSelector<AppState, boolean>(
    (state) => state.proxy.isConnected
  );
  const onClick = useCallback(() => {
    dispatch(proxy.actions.setActiveId(id));
    if (isConnected) {
      dispatch(proxy.actions.setIsConnected(false));
      dispatch(proxy.actions.setIsProcessing(true));
      ipc
        .callMain("changeServer")
        .catch((e) => {
          if (e.message && typeof e.message === "string")
            notifier.error(e.message);
          else notifier.error("Unknown error");
        })
        .finally(() => {
          dispatch(proxy.actions.setIsConnected(true));
          dispatch(proxy.actions.setIsProcessing(false));
        });
    }
  }, [dispatch, id, isConnected]);
  const [isEditing, setIsEditing] = useState(false);
  const activatedId = useSelector<AppState, string>(
    (state) => state.proxy.activeId
  );
  const [isShowQrCode, setIsShowQrCode] = useState(false);
  const isConnectedOrProcessing = useSelector<AppState, boolean>(
    (state) => state.proxy.isProcessing || state.proxy.isConnected
  );

  const dropdownItems = useMemo(() => {
    const isActivated = activatedId === id && isConnectedOrProcessing;

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
          dispatch(proxy.actions.deleteOne({ type: "shadowsocks", id }));
        },
        disabled: isActivated,
      },
    ];
  }, [activatedId, dispatch, id, isConnectedOrProcessing, props.shadowsocks]);
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
