import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { proxy, ProxyState, Shadowsocks } from "../../reducers/proxyReducer";
import { ServerCard } from "./ServerCard";
import { Dialog, ICON_NAME, notifier } from "../Core";
import { encodeSsUrl } from "../../utils/url";
import { clipboard } from "electron";
import { AppState } from "../../reducers/rootReducer";
import { EditShadowsocksDialog } from "../Dialogs/EditShadowsocksDialog";
import QRCode from "qrcode";

type ShadowsocksCardProps = {
  shadowsocks: Shadowsocks;
  delay?: string;
};

export const ShadowsocksCard = (props: ShadowsocksCardProps) => {
  const { id, name, host, regionCode } = props.shadowsocks;
  const dispatch = useDispatch();

  const proxyState = useSelector<AppState, ProxyState>(state => state.proxy);
  const onClick = useCallback(() => dispatch(proxy.actions.setActiveId(id)), [
    dispatch,
    id
  ]);
  const [isEditing, setIsEditing] = useState(false);
  const activatedId = useSelector<AppState, string>(
    state => state.proxy.activeId
  );
  const [isShowQrCode, setIsShowQrCode] = useState(false);
  const isStartedOrProcessing = useSelector<AppState, boolean>(
    state => state.proxy.isProcessing || state.proxy.isStarted
  );

  const getEditingShadowsocks = useCallback(() => {
    const shadowsocks = proxyState.shadowsockses.find(
      shadowsocks => shadowsocks.id === id
    );
    if (!shadowsocks) {
      const subscription = proxyState.subscriptions.find(subscription =>
        subscription.shadowsockses.some(shadowsocks => shadowsocks.id === id)
      );
      //Shadowsocks is sure to be found.
      return subscription?.shadowsockses.find(
        shadowsocks => shadowsocks.id === id
      );
    }
    return shadowsocks;
  }, [id, proxyState.shadowsockses, proxyState.subscriptions]);
  const dropdownItems = useMemo(() => {
    const isActivated = activatedId === id && isStartedOrProcessing;

    return [
      {
        iconName: ICON_NAME.EDIT,
        content: "Edit",
        handleOnClick: () => {
          setIsEditing(true);
        },
        disabled: isActivated
      },
      {
        iconName: ICON_NAME.COPY,
        content: "Copy Url",
        handleOnClick: async () => {
          const shadowsocks = getEditingShadowsocks();
          if (shadowsocks) {
            const url = encodeSsUrl(shadowsocks);
            await clipboard.writeText(url);
            notifier.success("Copy Url successfully");
          }
        }
      },
      {
        iconName: ICON_NAME.QRCODE,
        content: "Share QrCode",
        handleOnClick: async () => {
          setIsShowQrCode(true);
        }
      },

      {
        iconName: ICON_NAME.DELETE,
        isDanger: true,
        content: "Delete",
        handleOnClick: () => {
          dispatch(proxy.actions.delete({ type: "shadowsocks", id }));
        },
        disabled: isActivated
      }
    ];
  }, [activatedId, dispatch, getEditingShadowsocks, id, isStartedOrProcessing]);
  const closeEditDialog = useCallback(() => setIsEditing(false), []);
  const closeQrCodeDialog = useCallback(() => setIsShowQrCode(false), []);

  useEffect(() => {
    const shadowsocks = getEditingShadowsocks();
    if (shadowsocks && isShowQrCode) {
      const url = encodeSsUrl(shadowsocks);
      QRCode.toCanvas(document.getElementById("qr-code"), url).then();
    }
  }, [getEditingShadowsocks, isShowQrCode]);

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
          initialValue={getEditingShadowsocks()}
        />
      )}
      <ServerCard
        id={id}
        onClick={onClick}
        title={name || host}
        regionCode={regionCode}
        menuItems={dropdownItems}
      />
    </>
  );
};
