import { EditSubscriptionForm } from "../Forms/EditSubscriptionForm";
import { Dialog } from "../Core";
import React from "react";
import { Subscription } from "../../reducers/proxyReducer";

type EditSubscriptionDialogProps = {
  isShow: boolean;
  close: () => void;
  initialValue: Subscription;
};

export const EditSubscriptionDialog = (props: EditSubscriptionDialogProps) => {
  const { isShow, close, initialValue } = props;
  return (
    <Dialog isShow={isShow} close={close}>
      {isShow && (
        <EditSubscriptionForm close={close} defaultValue={initialValue} />
      )}
    </Dialog>
  );
};
