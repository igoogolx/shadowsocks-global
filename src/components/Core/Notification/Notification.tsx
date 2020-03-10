import { default as React, useCallback, useRef } from "react";
import styles from "./notification.module.css";
import { Message, MessageType } from "../Message/Message";
import ReactDOM from "react-dom";
import { Transition } from "react-transition-group";
import { useOnMount } from "../../../hooks";

const TRANSITION_TIMEOUT_MS = 240;
const DURATION_MS = 2000;

export type NotificationType = {
  id: number;
  title: string;
  type: MessageType;
  isShow: boolean;
};

type Notification = {
  notifications: NotificationType[];
  remove: (id: number) => void;
  close: (id: number) => void;
};

export const Notification = (props: Notification) => {
  const { notifications, remove, close } = props;
  let container = document.getElementById("notification-container");
  if (!container) {
    container = document.createElement("div");
    container.setAttribute("id", "notification-container");
    container.setAttribute("class", styles.container);
    document.body.prepend(container);
  }

  ReactDOM.render(
    notifications.map(notification => (
      <Transition
        appear={true}
        unmountOnExit={true}
        timeout={TRANSITION_TIMEOUT_MS}
        onExited={() => remove(notification.id)}
        in={notification.isShow}
        key={notification.id}
      >
        {state => (
          <div data-state={state} className={styles.animation}>
            <MessageWithDuration
              title={notification.title}
              duration={DURATION_MS}
              close={close}
              id={notification.id}
              type={notification.type}
            />
          </div>
        )}
      </Transition>
    )),
    container as HTMLDivElement
  );
};

const MessageWithDuration = (props: {
  duration: number;
  title: string;
  close: (id: number) => void;
  type: MessageType;
  id: number;
}) => {
  const { title, close, type, duration, id } = props;
  const closeTimer = useRef<NodeJS.Timeout | null>(null);
  const startCloseTimer = useCallback(() => {
    if (duration) {
      closeTimer.current = setTimeout(() => {
        close(id);
      }, duration);
    }
  }, [close, duration, id]);

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  useOnMount(() => {
    startCloseTimer();
    return clearCloseTimer;
  });

  return (
    <Message
      title={title}
      type={type}
      onMouseEnter={clearCloseTimer}
      onMouseLeave={startCloseTimer}
    />
  );
};
