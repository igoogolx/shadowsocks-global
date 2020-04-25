import React, { Suspense } from "react";
import styles from "./home.module.css";
import Header from "../Header/Header";
import Proxies from "../Proxies/Proxies";
import Footer from "../Footer/Footer";
import { useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";

export const Home = React.memo(() => {
  const isConnectingOrConnected = useSelector<AppState, boolean>(
    (state) => state.proxy.isStarted || state.proxy.isProcessing
  );
  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.body}>
          <div className={styles.content}>
            <Proxies />
          </div>
        </div>
      </div>
      <Suspense fallback={<></>}>
        {isConnectingOrConnected && <Footer />}
      </Suspense>
    </>
  );
});
