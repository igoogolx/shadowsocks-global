import React, { useState, useRef, useCallback } from "react";
import styles from "./navigation.module.css";
import { Button, Dropdown, Icon, ICON_NAME, ICON_SIZE } from "../Core";
import { NavLink, useHistory, useLocation } from "react-router-dom";
import { clipboard } from "electron";
import { decodeSsUrl } from "../../utils/url";
import { useDispatch } from "react-redux";
import { addProxy, Shadowsocks } from "../../reducers/proxyReducer";
import { lookupRegionCodes } from "../../utils/lookupRegionCodes";
import { EditShadowsocksDialog } from "../Dialogs/EditShadowsocksDialog";
import { EditSocks5sDialog } from "../Dialogs/EditSocks5sDialog";
import { EditSubscriptionDialog } from "../Dialogs/EditSubscriptionDialog";

const TYPES = ["shadowsocks", "socks5", "subscription"];

export const Navigation = () => {
  const [isShowDialog, setIsShowDialog] = useState(false);
  const [currentEditType, setCurrentEditType] = useState<
    "shadowsocks" | "subscription" | "socks5"
  >();
  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();
  const items = [
    { name: "Dashboard", route: "/dashboard", iconName: ICON_NAME.DASHBOARD },
    { name: "Proxies", route: "/proxies", iconName: ICON_NAME.PAPER_PLANE },
    { name: "Setting", route: "/setting", iconName: ICON_NAME.SETTING },
    { name: "About", route: "/about", iconName: ICON_NAME.ABOUT }
  ];
  const dropdownItems = useRef([
    {
      content: "Shadowsocks",
      handleOnClick: () => {
        setIsShowDialog(true);
        setCurrentEditType("shadowsocks");
      }
    },
    {
      content: "Subscription",
      handleOnClick: () => {
        setIsShowDialog(true);
        setCurrentEditType("subscription");
      }
    },
    {
      content: "Socks5",
      handleOnClick: () => {
        setIsShowDialog(true);
        setCurrentEditType("socks5");
      }
    },
    {
      content: "Import URL from Clipboard",
      handleOnClick: async () => {
        try {
          const url = clipboard.readText();
          let shadowsockses = decodeSsUrl(url);
          if (shadowsockses.length === 0) return;
          const hosts = shadowsockses.map(shadowsocks => shadowsocks.host);
          const regionCodes = await lookupRegionCodes(hosts);
          shadowsockses = shadowsockses.map((shadowsocks, index) => ({
            ...shadowsocks,
            regionCode: regionCodes[index]
          }));
          (shadowsockses as Shadowsocks[]).forEach(shadowsocks =>
            dispatch(addProxy({ type: "shadowsocks", config: shadowsocks }))
          );
          if (location.pathname !== "/proxies") history.push("/proxies");
        } catch (e) {}
      }
    }
  ]);

  const closeDialog = useCallback(() => {
    setIsShowDialog(false);
  }, []);
  return (
    <>
      <div className={styles.container}>
        <div className={styles.dialog}>
          <Dropdown items={dropdownItems.current}>
            <Button isPrimary={true}>
              Add Proxy
              <Icon
                iconName={ICON_NAME.PLUS}
                size={ICON_SIZE.SIZE16}
                className={styles.icon}
              />
            </Button>
          </Dropdown>
        </div>
        <ul className={styles.list}>
          {items.map(item => (
            <Item
              name={item.name}
              route={item.route}
              iconName={item.iconName}
              key={item.name}
            />
          ))}
        </ul>
      </div>
      {isShowDialog &&
        (currentEditType === TYPES[0] ? (
          <EditShadowsocksDialog close={closeDialog} />
        ) : currentEditType === TYPES[1] ? (
          <EditSocks5sDialog close={closeDialog} />
        ) : (
          <EditSubscriptionDialog close={closeDialog} />
        ))}
    </>
  );
};

type ItemProps = {
  name: string;
  route: string;
  iconName: string;
};

const Item = React.memo((props: ItemProps) => {
  const { name, route, iconName } = props;
  return (
    <li className={styles.item}>
      <NavLink
        to={route}
        exact={true}
        className={styles.link}
        activeClassName={styles.linkActive}
      >
        <Button className={styles.button}>
          <Icon iconName={iconName} className={styles.icon} />
          {name}
        </Button>
      </NavLink>
    </li>
  );
});

export default Navigation;
