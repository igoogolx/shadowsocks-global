import { Button, Dialog, Field, Form, INPUT_SIZE, notifier } from "../Core";
import React, { useCallback, useState } from "react";
import {
  addProxy,
  Subscription,
  updateProxy
} from "../../reducers/proxyReducer";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { decodeSsUrl } from "../../utils/url";
import { lookupRegionCodes } from "../../utils/lookupRegionCodes";
import uuid from "uuid/v4";
import styles from "./dialogs.module.css";
import { useRedirect } from "./useRedirect";
import { AppState } from "../../reducers/rootReducer";

const UPDATE_SUBSCRIPTIONS_TIMEOUT_MS = 5000;

type EditSubscriptionDialogProps = {
  close: () => void;
  initialValue?: Subscription;
};

export const EditSubscriptionDialog = React.memo(
  (props: EditSubscriptionDialogProps) => {
    const { close, initialValue } = props;
    const dispatch = useDispatch();
    const [value, setValue] = useState(initialValue || {});
    const [isLoading, setIsLoading] = useState(false);
    const subscriptionUrls = useSelector<AppState, string[]>(state =>
      state.proxy.subscriptions.map(subscription => subscription.url)
    );
    const redirect = useRedirect();
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
          if (subscriptionUrls.indexOf(subscription.url) !== -1)
            return notifier.error("Add the subscription repeatedly");
        }
        setIsLoading(true);
        const name = new URL(subscription.url).hostname;
        const nodesBase64 = await axios(subscription.url, {
          timeout: UPDATE_SUBSCRIPTIONS_TIMEOUT_MS
        });
        const nodes = Buffer.from(nodesBase64.data, "base64").toString();
        const shadowsockses = decodeSsUrl(nodes);
        const hosts = shadowsockses.map(shadowsocks => shadowsocks.host);
        const regionCodes = await lookupRegionCodes(hosts);
        const checkedShadowsockses = shadowsockses.map(
          (shadowsocks, index) => ({
            ...shadowsocks,
            regionCode: regionCodes[index],
            id: uuid()
          })
        );
        if (initialValue)
          dispatch(
            updateProxy({
              type: "subscription",
              config: {
                ...subscription,
                name,
                id: initialValue.id,
                shadowsockses: checkedShadowsockses
              }
            })
          );
        else
          dispatch(
            addProxy({
              type: "subscription",
              config: {
                ...subscription,
                name,
                shadowsockses: checkedShadowsockses
              }
            })
          );
        notifier.success("Update the subscription successfully!");
        close();
        redirect();
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
