import React, { Suspense } from "react";
import styles from "./home.module.css";
import { Route, useHistory, Switch } from "react-router-dom";
import { useOnMount } from "../../hooks";
import Header from "../Header/Header";

const Dashboard = React.lazy(() => import("../Dashboard/Dashboard"));
const Setting = React.lazy(() => import("../Setting/Setting"));
const Proxies = React.lazy(() => import("../Proxies/Proxies"));
const Footer = React.lazy(() => import("../Footer/Footer"));
const About = React.lazy(() => import("../About/About"));
const Navigation = React.lazy(() => import("../Navigation/Navigation"));

export const Home = () => {
  const history = useHistory();
  useOnMount(() => {
    history.push("/dashboard");
  });
  return (
    <>
      <Header />
      <Suspense fallback={<></>}>
        <Navigation />
      </Suspense>
      <div className={styles.container}>
        <div className={styles.body}>
          <div className={styles.content}>
            <Suspense fallback={<></>}>
              <Switch>
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/setting" component={Setting} />
                <Route path="/proxies" component={Proxies} />
                <Route path="/about" component={About} />
              </Switch>
            </Suspense>
          </div>
        </div>
      </div>
      <Suspense fallback={<></>}>
        <Footer />
      </Suspense>
    </>
  );
};
