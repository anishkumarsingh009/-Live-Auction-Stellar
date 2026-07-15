import { rpc, scValToNative, nativeToScVal } from "@stellar/stellar-sdk";
import { CONTRACT_ID, RPC_URL } from "./config";

const server = new rpc.Server(RPC_URL);

// getEvents topic filters must be base64-encoded XDR ScVal segments, not
// plain strings — this encodes the "bid" symbol our contract emits as the
// first topic segment.
const BID_TOPIC_FILTER = nativeToScVal("bid", { type: "symbol" }).toXDR("base64");

export interface BidEvent {
  bidder: string;
  amount: number;
  ledger: number;
  txHash: string;
}

/**
 * Polls Soroban RPC's getEvents for `bid` events emitted by this contract.
 * This is what drives the "live" leaderboard — every connected client sees
 * new high bids without refreshing.
 */
export function subscribeToBidEvents(
  onEvent: (e: BidEvent) => void,
  onError?: (err: Error) => void
): () => void {
  let stopped = false;
  let cursorLedger: number | null = null;

  const poll = async () => {
    if (stopped) return;
    try {
      const latest = await server.getLatestLedger();
      if (cursorLedger === null) {
        cursorLedger = Math.max(latest.sequence - 100, 1);
      }

      const res = await server.getEvents({
        startLedger: cursorLedger,
        filters: [
          {
            type: "contract",
            contractIds: [CONTRACT_ID],
            topics: [[BID_TOPIC_FILTER]],
          },
        ],
        limit: 50,
      });

      for (const event of res.events) {
        const topicVals = event.topic.map((t) => scValToNative(t));
        const bidder = topicVals[1];
        const amount = scValToNative(event.value);
        onEvent({
          bidder: typeof bidder === "string" ? bidder : String(bidder),
          amount: typeof amount === "bigint" ? Number(amount) : Number(amount),
          ledger: event.ledger,
          txHash: event.txHash,
        });
      }

      if (res.events.length > 0) {
        cursorLedger = res.events[res.events.length - 1].ledger + 1;
      } else if (res.latestLedger) {
        cursorLedger = Math.min(cursorLedger, res.latestLedger);
      }
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    } finally {
      if (!stopped) {
        setTimeout(poll, 4000);
      }
    }
  };

  poll();

  return () => {
    stopped = true;
  };
}
