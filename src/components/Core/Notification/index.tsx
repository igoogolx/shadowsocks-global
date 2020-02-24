import { Notification, NotificationType } from "./Notification";
import { MessageType } from "../Message/Message";

const createNotifier = () => {
  let state = { notifications: [] as NotificationType[], counter: 0 };

  const add = (title: string, type: MessageType) => {
    const notification = {
      title,
      type,
      id: state.counter,
      isShow: true
    };
    state = {
      ...state,
      notifications: [...state.notifications, notification],
      counter: ++state.counter
    };
    return update();
  };

  const close = (id: number) => {
    const findIndex = (notifications: NotificationType[], id: number) =>
      notifications.findIndex(t => t.id === id);
    const index = findIndex(state.notifications, id);
    const newNotification = {
      ...state.notifications[index],
      isShow: false
    };
    state = {
      ...state,
      notifications: [
        ...state.notifications.slice(0, index),
        newNotification,
        ...state.notifications.slice(index + 1, state.notifications.length)
      ]
    };
    return update();
  };

  const remove = (id: number) => {
    state = {
      ...state,
      notifications: state.notifications.filter(
        notification => notification.id !== id
      )
    };
    return update();
  };

  const update = () => {
    Notification({ notifications: state.notifications, remove, close });
  };
  const success = (title: string) => {
    add(title, "Success");
  };
  const error = (title: string) => add(title, "Error");

  return {
    success,
    error,
    close,
    remove
  };
};

export const notifier = createNotifier();
