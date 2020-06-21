import React, { Suspense } from "react";
import styles from "./home.module.css";
import Header from "../Header/Header";
import { useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";

const Proxies = React.lazy(() => import("../Proxies/Proxies"));
const Footer = React.lazy(() => import("../Footer/Footer"));
export const Home = React.memo(() => {
  const isConnectingOrConnected = useSelector<AppState, boolean>(
    (state) => state.proxy.isConnected || state.proxy.isProcessing
  );
  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.body}>
          <div className={styles.content}>
            <Suspense fallback={<></>}>
              <Proxies />
            </Suspense>
          </div>
        </div>
      </div>
      <Suspense fallback={<></>}>
        {isConnectingOrConnected && <Footer />}
      </Suspense>
    </>
  );
});
