import React from "react";
import styles from "./dashboard.module.css";
import { SpeedGraphCard } from "../Cards/SpeedGraphCard";
import { LatencyCard } from "../Cards/LatencyCard";

export const Dashboard = () => (
  <div className={styles.container}>
    <LatencyCard />
    <div className={styles.flexContainer}>
      <SpeedGraphCard />
    </div>
  </div>
);

export default Dashboard;
