/**
 * Fan-out cost of one event to a channel with `members` subscribers spread over `servers` connection servers.
 *
 * Assumption: each member is attached to a server chosen uniformly at random and independently.
 * Then a given server holds no member with probability (1 - 1/S)^m, so the expected number of servers with at least one member is
 * S * (1 - (1 - 1/S)^m).
 */

export interface FanoutCost {
  /** Internal messages if every server receives every event (one global topic). */
  broadcastAll: number;
  /** Internal messages if each server subscribes only to channels it has members for. */
  perChannelTopic: number;
  /** Internal messages if the sender looks up every member in a registry and sends one message each. */
  perUser: number;
}

export function expectedServers(servers: number, members: number): number {
  if (servers <= 1) return members > 0 ? 1 : 0;
  return servers * (1 - Math.pow(1 - 1 / servers, members));
}

export function fanoutCost(servers: number, members: number): FanoutCost {
  return { broadcastAll: servers, perChannelTopic: expectedServers(servers, members), perUser: members };
}
