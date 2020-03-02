import { EffectCallback, useEffect } from "react";

//TODO: Remove useOnMount
export const useOnMount = (fn: EffectCallback) => {
  useEffect(fn, []); // eslint-disable-line
};
