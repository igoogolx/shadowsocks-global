import { Dialog, Icon, ICON_NAME } from "../Core";
import React from "react";

type LoadingDialogProps = {
  content?: string;
};
export const LoadingDialog = (props: LoadingDialogProps) => {
  const { content } = props;
  return (
    <Dialog>
      <Icon iconName={ICON_NAME.LOADING} isLoading={true} />
      {content}
    </Dialog>
  );
};
