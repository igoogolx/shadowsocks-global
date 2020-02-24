import { EffectCallback, useEffect } from "react";

export const useOnMount = (fn: EffectCallback) => {
  useEffect(fn, []); // eslint-disable-line
};
