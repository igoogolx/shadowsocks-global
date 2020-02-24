const TAP_DEVICE_ADDRESS = "10.0.85.3";

const Cap = require("cap").Cap;
const decoders = require("cap").decoders;
export class Traffic {
  private cap: any;
  private PROTOCOL: any;
  private bufSize = 10 * 1024 * 1024;
  private buffer = Buffer.alloc(65535);
  private totalUsage = 0;
  private isCapturePockets = true;
  private pockets: {
    type: "sent" | "received";
    length: number;
    port: number;
  }[] = [];
  private linkType: any;

  listener = (numberOfBytes: any) => {
    this.totalUsage += numberOfBytes;
    if (!this.isCapturePockets) return;
    let packetType: "sent" | "received";
    if (this.linkType === "ETHERNET") {
      let ret = decoders.Ethernet(this.buffer);
      if (ret.info.type === this.PROTOCOL.ETHERNET.IPV4) {
        ret = decoders.IPV4(this.buffer, ret.offset);
        if (ret.info.srcaddr === TAP_DEVICE_ADDRESS) packetType = "sent";
        else packetType = "received";
        if (ret.info.protocol === this.PROTOCOL.IP.TCP) {
          ret = decoders.TCP(this.buffer, ret.offset);
        } else if (ret.info.protocol === this.PROTOCOL.IP.UDP) {
          ret = decoders.UDP(this.buffer, ret.offset);
        } else {
          console.log(
            "Unsupported IPv4 protocol: " + this.PROTOCOL.IP[ret.info.protocol]
          );
          return;
        }
        this.pockets.push({
          type: packetType,
          length: numberOfBytes,
          port: packetType === "sent" ? ret.info.srcport : ret.info.dstport
        });
      } else
        console.log(
          "Unsupported Ethertype: " + this.PROTOCOL.ETHERNET[ret.info.type]
        );
    }
  };
  public start() {
    this.cap = new Cap();
    const tapDevice = Cap.findDevice(TAP_DEVICE_ADDRESS);
    this.PROTOCOL = decoders.PROTOCOL;
    this.linkType = this.cap.open(tapDevice, "", this.bufSize, this.buffer);
    this.cap.setMinBytes && this.cap.setMinBytes(0);
    this.cap.on("packet", this.listener);
  }
  public stop() {
    if (this.cap) this.cap.close();
    this.linkType = null;
    this.totalUsage = 0;
  }
  public resetPockets() {
    this.pockets = [];
  }
  set setIsCapturePockets(isCapturePockets: boolean) {
    this.isCapturePockets = isCapturePockets;
  }
  get getTotalUsage() {
    return this.totalUsage;
  }
  get getPockets() {
    return this.pockets;
  }
}
