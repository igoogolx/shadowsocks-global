import React from "react";
import styles from "./dashboard.module.css";
import { TrafficCard } from "../Cards/TrafficCard";
import { SpeedGraphCard } from "../Cards/SpeedGraphCard";
import { LatencyCard } from "../Cards/LatencyCard";
import { PortNetSpeedCard } from "../Cards/PortNetSpeedCard";

export const Dashboard = () => (
  <div className={styles.container}>
    <LatencyCard />
    <TrafficCard />
    <div className={styles.flexContainer}>
      <SpeedGraphCard />
      <PortNetSpeedCard />
    </div>
  </div>
);

export default Dashboard;
