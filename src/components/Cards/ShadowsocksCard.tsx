import React, { useCallback, useContext } from "react";
import { ProxiesContext, ProxiesContextValue } from "../Proxies/Proxies";
import { useDispatch } from "react-redux";
import { setActiveId, Shadowsocks } from "../../reducers/proxyReducer";
import { ServerCard } from "./ServerCard";

type ShadowsocksCardProps = {
  shadowsocks: Shadowsocks;
  delay?: string;
};

export const ShadowsocksCard = (props: ShadowsocksCardProps) => {
  const { shadowsocks } = props;
  const dispatch = useDispatch();
  const { dropdownRef, setIsShowDropdown, setEditingId } = useContext(
    ProxiesContext
  ) as ProxiesContextValue;
  const onClick = useCallback(() => dispatch(setActiveId(shadowsocks.id)), [
    dispatch,
    shadowsocks.id
  ]);
  const onClickDropdown = useCallback(
    e => {
      setEditingId(shadowsocks.id);
      dropdownRef.current = e.currentTarget;
      setIsShowDropdown(isShow => !isShow);
    },
    [dropdownRef, setEditingId, setIsShowDropdown, shadowsocks.id]
  );

  return (
    <ServerCard
      id={shadowsocks.id}
      onClickDropdown={onClickDropdown}
      onClick={onClick}
      title={shadowsocks.name || shadowsocks.host}
      regionCode={shadowsocks.regionCode}
    />
  );
};
