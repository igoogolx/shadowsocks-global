// Copyright 2018 The Outline Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { createConnection, Socket } from "net";
import { platform } from "os";
import { Route } from "./process_manager";
import { installWindowsService } from "./customInstall";
import { logger } from "./log";

const SERVICE_NAME =
  platform() === "win32"
    ? "\\\\.\\pipe\\ShadowsocksGlobalServicePipe"
    : "/var/run/shadowsocks_global_controller";

export enum ConnectionStatus {
  CONNECTED,
  DISCONNECTED,
  RECONNECTING,
}

interface RoutingServiceRequest {
  action: string;
  parameters: { [parameter: string]: string[] };
}

interface RoutingServiceResponse {
  action: RoutingServiceAction; // Matches RoutingServiceRequest.action
  statusCode: RoutingServiceStatusCode;
  errorMessage?: string;
  connectionStatus: ConnectionStatus;
}

enum RoutingServiceAction {
  CONFIGURE_ROUTING = "configureRouting",
  RESET_ROUTING = "resetRouting",
  STATUS_CHANGED = "statusChanged",
  ADD_RESERVED_ROUTE = "addReservedRoutes",
}

enum RoutingServiceStatusCode {
  SUCCESS = 0,
  GENERIC_FAILURE = 1,
  UNSUPPORTED_ROUTING_TABLE = 2,
}

// Communicates with the Outline routing daemon via a Unix socket.
//
// A minimal life-cycle is supported:
//  - CONFIGURE_ROUTING is *always* the first message sent on the pipe.
//  - The only subsequent supported operation is RESET_ROUTING.
//  - In the meantime, the client may receive zero or more STATUS_CHANGED events.
//
// That's it! This helps us connect to the service for *as short a time as possible* which is
// important when trying to implement a Promise-like interface over what is essentially a pipe *and*
// on Windows where only one client may be connected to the service at any given time.
//
// To test:
//  - Windows: net start|stop ShadowsocksGlobalService
export class RoutingDaemon {
  private socket: Socket | undefined;

  private fulfillDisconnect!: () => void;

  private disconnected = new Promise<void>((F) => {
    this.fulfillDisconnect = F;
  });

  private networkChangeListener?: (status: ConnectionStatus) => void;

  constructor(
    private routes: Route,
    private dns: { servers: string[]; whiteListServers: string[] }
  ) {}

  // Fulfills once a connection is established with the routing daemon *and* it has successfully
  // configured the system's routing table.
  async start(retry = true) {
    return new Promise<void>((fulfill, reject) => {
      const newSocket = (this.socket = createConnection(SERVICE_NAME, () => {
        newSocket.removeAllListeners("error");
        const cleanup = () => {
          try {
            newSocket.removeAllListeners();
            this.fulfillDisconnect();
          } catch (e) {
            logger.error(e);
          }
        };
        newSocket.once("close", cleanup);
        newSocket.once("error", cleanup);

        newSocket.once("data", (data) => {
          const message = RoutingDaemon.parseRoutingServiceResponse(data);
          if (
            !message ||
            message.action !== RoutingServiceAction.CONFIGURE_ROUTING ||
            message.statusCode !== RoutingServiceStatusCode.SUCCESS
          ) {
            // NOTE: This will rarely occur because the connectivity tests
            //       performed when the user clicks "CONNECT" should detect when
            //       the system is offline and that, currently, is pretty much
            //       the only time the routing service will fail.
            reject(
              new Error(
                !!message
                  ? message.errorMessage
                  : "empty routing service response"
              )
            );

            newSocket.end();
            return;
          }

          newSocket.on("data", this.dataHandler.bind(this));
          fulfill();
        });

        const parameters: { [key: string]: string | string[] | boolean } = {
          proxyRoutes: this.routes.proxy,
          reservedRoutes: this.routes.reserved,
          dnsServers: this.dns.servers,
          whiteDnsServers: this.dns.whiteListServers,
        };
        newSocket.write(
          JSON.stringify({
            action: RoutingServiceAction.CONFIGURE_ROUTING,
            parameters,
          } as RoutingServiceRequest)
        );
      }));

      const initialErrorHandler = () => {
        if (!retry) {
          reject(new Error("routing daemon is not running"));
          return;
        }

        logger.info(`(re-)installing routing daemon`);
        installWindowsService()
          .then(() => {
            fulfill(this.start(false));
          })
          .catch((e) => {
            logger.error(e);
          });
      };

      newSocket.once("error", initialErrorHandler);
    });
  }

  private dataHandler(data: Buffer) {
    const message = RoutingDaemon.parseRoutingServiceResponse(data);
    if (!message) {
      return;
    }
    switch (message.action) {
      case RoutingServiceAction.STATUS_CHANGED:
        if (this.networkChangeListener) {
          this.networkChangeListener(message.connectionStatus);
        }
        break;

      case RoutingServiceAction.RESET_ROUTING:
        // TODO: examine statusCode
        if (this.socket) {
          logger.info("Close socket");
          this.socket.end();
        }
        break;
      case RoutingServiceAction.ADD_RESERVED_ROUTE:
        logger.info("Add the reserved route successfully");
        break;
      default:
        console.error(
          `unexpected message from background service: ${data.toString()}`
        );
    }
  }

  // Parses JSON `data` as a `RoutingServiceResponse`. Logs the error and returns undefined on
  // failure.
  private static parseRoutingServiceResponse(
    data: Buffer
  ): RoutingServiceResponse | undefined {
    if (!data) {
      logger.error("received empty response from routing service");
      return undefined;
    }
    let response: RoutingServiceResponse | undefined = undefined;
    try {
      response = JSON.parse(data.toString());
    } catch (error) {
      logger.error(
        `failed to parse routing service response: ${data.toString()}`
      );
    }
    return response;
  }

  async addReservedRoute(route: string) {
    return new Promise<void>((fulfill, reject) => {
      if (!this.socket) {
        return reject("The Vpn has not been started!");
      }
      this.socket.write(
        JSON.stringify({
          action: RoutingServiceAction.ADD_RESERVED_ROUTE,
          parameters: {
            reservedRoutes: [route],
          },
        })
      );

      this.socket.once("data", (data) => {
        const message = RoutingDaemon.parseRoutingServiceResponse(data);
        if (
          !message ||
          message.action !== RoutingServiceAction.ADD_RESERVED_ROUTE ||
          message.statusCode !== RoutingServiceStatusCode.SUCCESS
        ) {
          // NOTE: This will rarely occur because the connectivity tests
          //       performed when the user clicks "CONNECT" should detect when
          //       the system is offline and that, currently, is pretty much
          //       the only time the routing service will fail.
          reject(
            new Error(
              !!message
                ? message.errorMessage
                : "empty routing service response"
            )
          );
        }
        fulfill();
      });
    });
  }

  // Use #onceDisconnected to be notified when the connection terminates.
  stop() {
    if (!this.socket) {
      // Never started.
      this.fulfillDisconnect();
      return;
    }

    this.socket.write(
      JSON.stringify({
        action: RoutingServiceAction.RESET_ROUTING,
        parameters: {},
      })
    );
  }

  public get onceDisconnected() {
    return this.disconnected;
  }

  public set onNetworkChange(
    newListener: ((status: ConnectionStatus) => void) | undefined
  ) {
    this.networkChangeListener = newListener;
  }
}
