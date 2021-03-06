import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { proxy, Shadowsocks } from "../../reducers/proxyReducer";
import { ServerCard } from "./ServerCard";
import { Dialog, ICON_NAME, notifier } from "../Core";
import { encodeSsUrl } from "../../utils/url";
import { AppState } from "../../reducers/rootReducer";
import { EditShadowsocksDialog } from "../Dialogs/EditShadowsocksDialog";
import QRCode from "qrcode";
import { PingServer, usePing } from "../../hooks";
import { changeServer } from "../../utils/ipc";
import { useTranslation } from "react-i18next";

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
  const pingInfo = useMemo(() => [{ type: "shadowsocks", id, host, port }], [
    host,
    id,
    port,
  ]);
  const { isPinging, ping } = usePing(pingInfo as PingServer[]);
  const { t } = useTranslation();
  const onClick = useCallback(() => {
    dispatch(proxy.actions.setActiveId(id));
    if (isConnected) {
      dispatch(proxy.actions.setIsConnected(false));
      dispatch(proxy.actions.setIsProcessing(true));
      changeServer()
        .catch((e) => {
          if (e.message && typeof e.message === "string")
            notifier.error(e.message);
          else notifier.error(t("message.error.unknown"));
        })
        .finally(() => {
          dispatch(proxy.actions.setIsConnected(true));
          dispatch(proxy.actions.setIsProcessing(false));
        });
    }
  }, [dispatch, id, isConnected, t]);
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
        iconName: ICON_NAME.INSTRUMENT,
        content: t("proxy.server.ping"),
        handleOnClick: ping,
        disabled: isPinging || isConnected,
      },
      {
        iconName: ICON_NAME.EDIT,
        content: t("proxy.server.edit"),
        handleOnClick: () => {
          setIsEditing(true);
        },
        disabled: isActivated,
      },
      {
        iconName: ICON_NAME.COPY,
        content: t("proxy.server.copy"),
        handleOnClick: async () => {
          const url = encodeSsUrl(props.shadowsocks);
          await navigator.clipboard.writeText(url);
          notifier.success(t("message.success.copy"));
        },
      },
      {
        iconName: ICON_NAME.QRCODE,
        content: t("proxy.server.share"),
        handleOnClick: async () => {
          setIsShowQrCode(true);
        },
      },

      {
        iconName: ICON_NAME.DELETE,
        isDanger: true,
        content: t("proxy.server.delete"),
        handleOnClick: () => {
          dispatch(proxy.actions.deleteOne({ type: "shadowsocks", id }));
        },
        disabled: isActivated,
      },
    ];
  }, [
    activatedId,
    dispatch,
    id,
    isConnected,
    isConnectedOrProcessing,
    isPinging,
    ping,
    props.shadowsocks,
    t,
  ]);
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
