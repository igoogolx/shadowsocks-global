import React, { useCallback, useState } from "react";
import { Field, Form } from "../Core/Form";
import styles from "./forms.module.css";
import { Button, INPUT_SIZE } from "../Core";
import classNames from "classnames";
import {
  addProxy,
  Subscription,
  updateProxy
} from "../../reducers/proxyReducer";
import { useDispatch } from "react-redux";
import { decodeSsUrl } from "../../utils/url";
import axios from "axios";
import uuid from "uuid/v4";
import { lookupRegionCodes } from "../../utils/lookupRegionCodes";
import { notifier } from "../Core";
import { useHistory, useLocation } from "react-router-dom";

const UPDATE_SUBSCRIPTIONS_TIMEOUT_MS = 5000;

type EditSubscriptionFormProps = {
  close: () => void;
  className?: string;
  defaultValue?: Subscription;
};

//https://github.com/axios/axios/issues/2232. To avoid same-origin policy warning, the webSecurity of BrowserWindow is set to false when developing
//axios.defaults.adapter = require("axios/lib/adapters/http.js");

export const EditSubscriptionForm = (props: EditSubscriptionFormProps) => {
  const { close, className, defaultValue } = props;
  const dispatch = useDispatch();
  const [value, setValue] = useState(defaultValue || {});
  const [isLoading, setIsLoading] = useState(false);
  const history = useHistory();
  const location = useLocation();
  const success = () => {
    close();
    if (location.pathname !== "/proxies") history.push("/proxies");
  };
  const onChange = useCallback(
    (fieldValue: { [key: string]: any }) => {
      setValue({ ...value, ...fieldValue });
    },
    [value]
  );
  const onSubmit = async (
    subscription: Omit<Subscription, "id" | "name" | "shadowsockses">
  ) => {
    setIsLoading(true);
    try {
      const name = new URL(subscription.url).hostname;
      const nodesBase64 = await axios(subscription.url, {
        timeout: UPDATE_SUBSCRIPTIONS_TIMEOUT_MS
      });
      const nodes = Buffer.from(nodesBase64.data, "base64").toString();
      const shadowsockses = decodeSsUrl(nodes);
      const hosts = shadowsockses.map(shadowsocks => shadowsocks.host);
      const regionCodes = await lookupRegionCodes(hosts);
      const checkedShadowsockses = shadowsockses.map((shadowsocks, index) => ({
        ...shadowsocks,
        regionCode: regionCodes[index],
        id: uuid()
      }));
      if (defaultValue)
        dispatch(
          updateProxy({
            type: "subscription",
            config: {
              ...subscription,
              name,
              id: defaultValue.id,
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
      success();
      close();
    } catch (e) {
      notifier.error("Fail to update the subscription!");
      setIsLoading(false);
    }
  };
  return (
    <Form
      onSubmit={onSubmit}
      className={classNames(styles.container, className)}
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
          onClick={() => {
            close();
          }}
          className={styles.button}
        >
          Cancel
        </Button>
      </div>
    </Form>
  );
};
