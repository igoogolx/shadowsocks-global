import { Button, Dialog, Field, Form, INPUT_SIZE, notifier } from "../Core";
import React, { useCallback, useState } from "react";
import { proxy, Subscription } from "../../reducers/proxyReducer";
import { useDispatch, useSelector } from "react-redux";
import styles from "./dialogs.module.css";
import { AppState } from "../../reducers/rootReducer";
import { updateSubscription } from "../../utils/helper";

type EditSubscriptionDialogProps = {
  close: () => void;
  initialValue?: Subscription;
};

//Update or add the subscription
export const EditSubscriptionDialog = React.memo(
  (props: EditSubscriptionDialogProps) => {
    const { close, initialValue } = props;
    const dispatch = useDispatch();
    const [value, setValue] = useState(initialValue || {});
    const [isLoading, setIsLoading] = useState(false);
    const subscriptions = useSelector<AppState, Subscription[]>(
      (state) => state.proxy.subscriptions
    );
    const onChange = useCallback(
      (fieldValue: { [key: string]: any }) => {
        setValue({ ...value, ...fieldValue });
      },
      [value]
    );
    const onSubmit = async (
      subscription: Omit<Subscription, "id" | "name" | "shadowsockses">
    ) => {
      try {
        //Check whether the url has been added.
        if (!initialValue) {
          if (subscriptions.some((item) => item.url === subscription.url))
            return notifier.error("Add the subscription repeatedly");
        }
        setIsLoading(true);
        const name = new URL(subscription.url).hostname;
        const shadowsockses = await updateSubscription(subscription.url);
        if (initialValue)
          dispatch(
            proxy.actions.update({
              type: "subscription",
              config: {
                ...subscription,
                name,
                id: initialValue.id,
                shadowsockses,
              },
            })
          );
        else
          dispatch(
            proxy.actions.add({
              type: "subscription",
              config: {
                ...subscription,
                name,
                shadowsockses,
              },
            })
          );
        notifier.success("Update the subscription successfully!");
        close();
      } catch (e) {
        notifier.error("Fail to update the subscription!");
        setIsLoading(false);
      }
    };

    return (
      <Dialog close={close} disabled={isLoading}>
        <Form
          onSubmit={onSubmit}
          className={styles.container}
          value={value}
          onChange={onChange}
        >
          <Field
            name={"url"}
            label={"Url"}
            className={styles.input}
            size={INPUT_SIZE.AUTO}
            autoFocus={true}
          />
          <div className={styles.buttonContainer}>
            <Button
              isPrimary={true}
              className={styles.button}
              isLoading={isLoading}
              disabled={isLoading}
              type={"submit"}
            >
              Save
            </Button>
            <Button
              isPrimary={true}
              onClick={close}
              className={styles.button}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </Form>
      </Dialog>
    );
  }
);
