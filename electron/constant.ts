import { SMART_DNS_ADDRESS } from "../src/constants";

export const GLOBAL_PROXY_ROUTES = ["0.0.0.0/1", "128.0.0.0/1"];

export const GLOBAL_RESERVED_ROUTES = [
  "0.0.0.0/8",
  "10.0.0.0/8",
  "100.64.0.0/10",
  "169.254.0.0/16",
  "172.16.0.0/12",
  "192.0.0.0/24",
  "192.0.2.0/24",
  "192.31.196.0/24",
  "192.52.193.0/24",
  "192.88.99.0/24",
  "192.168.0.0/16",
  "192.175.48.0/24",
  "198.18.0.0/15",
  "198.51.100.0/24",
  "203.0.113.0/24",
  "240.0.0.0/4"
];
//TODO: Customized smart dns servers
export const SMART_DNS__CHINA_SERVES = ["119.29.29.29", "119.28.28.28"];
export const SMART_DNS__OTHERS_SERVERS = ["8.8.8.8", "8.8.4.4"];
export const SMART_DNS_WHITE_LIST_SERVERS = [
  ...SMART_DNS__CHINA_SERVES,
  ...SMART_DNS__OTHERS_SERVERS,
  SMART_DNS_ADDRESS
];
