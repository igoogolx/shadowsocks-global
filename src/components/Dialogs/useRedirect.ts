import { useHistory, useLocation } from "react-router-dom";
import { useCallback } from "react";

export const useRedirect = () => {
  const history = useHistory();
  const location = useLocation();
  return useCallback(() => {
    if (location.pathname !== "/proxies") history.push("/proxies");
  }, [history, location.pathname]);
};
