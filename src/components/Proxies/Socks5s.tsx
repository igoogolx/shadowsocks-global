import React, {
  useMemo,
  useState,
  createContext,
  MutableRefObject,
  Dispatch,
  SetStateAction,
  useCallback
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import { deleteProxy, Socks5 } from "../../reducers/proxyReducer";
import { Dialog, ICON_NAME, Menu } from "../Core";
import { usePopup } from "../../hooks";
import { EditSocks5Form } from "../Forms/EditSocks5Form";
import styles from "./proxies.module.css";
import { Socks5Card } from "../Cards/Socks5Card";

export type Socks5sContextValue = {
  dropdownRef: MutableRefObject<HTMLElement | undefined>;
  setIsShowDropdown: Dispatch<SetStateAction<boolean>>;
  setEditingId: (id: string) => void;
};
export const Socks5sContext = createContext<Socks5sContextValue | null>(null);
export const Socks5s = React.memo(() => {
  const socks5s = useSelector<AppState, Socks5[]>(state => state.proxy.socks5s);
  const [editingId, setEditingId] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const dispatch = useDispatch();
  const dropdownItems = useMemo(
    () => [
      {
        iconName: ICON_NAME.EDIT,
        content: "Edit",
        handleOnClick: () => setIsEditing(true)
      },
      {
        iconName: ICON_NAME.DELETE,
        isDanger: true,
        content: "Delete",
        handleOnClick: () => {
          dispatch(deleteProxy({ type: "socks5", id: editingId }));
        }
      }
    ],
    [dispatch, editingId]
  );
  const [dropdownRef, setIsShowDropdown] = usePopup(
    <Menu items={dropdownItems} />
  );
  const getEditSocks5 = () => socks5s.find(socks5 => socks5.id === editingId);
  const closeDialog = useCallback(() => setIsEditing(false), []);
  return (
    <>
      <Dialog isShow={isEditing} close={closeDialog}>
        {isEditing && (
          <EditSocks5Form
            close={() => setIsEditing(false)}
            defaultValue={getEditSocks5()}
          />
        )}
      </Dialog>
      {socks5s.length !== 0 && <div className={styles.title}>Sock5s</div>}
      <div className={styles.shadowsockses}>
        <Socks5sContext.Provider
          value={{ dropdownRef, setIsShowDropdown, setEditingId }}
        >
          {socks5s.map(socks5 => (
            <Socks5Card socks5={socks5} key={socks5.id} />
          ))}
        </Socks5sContext.Provider>
      </div>
    </>
  );
});
