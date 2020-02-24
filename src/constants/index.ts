export const ENCRYPTION_METHODS = [
  "aes-128-gcm",
  "aes-192-gcm",
  "aes-256-gcm",
  "rc4-md5",
  "aes-128-cfb",
  "aes-192-cfb",
  "aes-256-cfb",
  "aes-128-ctr",
  "aes-192-ctr",
  "aes-256-ctr",
  "bf-cfb",
  "camellia-128-cfb",
  "camellia-192-cfbw",
  "camellia-256-cfb",
  "chacha20-ietf-poly1305",
  "xchacha20-ietf-poly1305",
  "salsa20",
  "chacha20",
  "chacha20-ietf"
];

export const SMART_DNS_ADDRESS = "127.0.0.1";
export const DNS_SMART_TYPE = "smart";
export const DNS_CUSTOMIZED_TYPE = "customized";
export const DNS_OPTIONS = [
  {
    name: "Google dns",
    preferredServer: "8.8.8.8",
    alternateServer: "8.8.4.4"
  },
  {
    name: "DNSPod",
    preferredServer: "119.29.29.29",
    alternateServer: "119.28.28.28"
  }
];
