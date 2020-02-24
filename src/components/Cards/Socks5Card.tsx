import { setActiveId, Socks5 } from "../../reducers/proxyReducer";
import { ServerCard } from "./ServerCard";
import React, { useCallback, useContext } from "react";
import { useDispatch } from "react-redux";
import { Socks5sContext, Socks5sContextValue } from "../Proxies/Socks5s";

type Socks5CardProps = {
  socks5: Socks5;
  isActive?: boolean;
};

export const Socks5Card = React.memo((props: Socks5CardProps) => {
  const { socks5 } = props;
  const dispatch = useDispatch();
  const onClick = useCallback(() => dispatch(setActiveId(socks5.id)), [
    dispatch,
    socks5.id
  ]);
  const { dropdownRef, setIsShowDropdown, setEditingId } = useContext(
    Socks5sContext
  ) as Socks5sContextValue;
  const onClickDropdownMemo = useCallback(
    e => {
      dropdownRef.current = e.currentTarget;
      setEditingId(socks5.id);
      setIsShowDropdown(isShow => !isShow);
    },
    [dropdownRef, setEditingId, setIsShowDropdown, socks5.id]
  );

  return (
    <ServerCard
      onClickDropdown={onClickDropdownMemo}
      onClick={onClick}
      title={socks5.host}
      id={socks5.id}
    />
  );
});
