import { useState } from "react";
import { AuctionState } from "../lib/contract";
import { AMOUNT_LABEL } from "../lib/config";

function shorten(addr: string) {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function formatRemaining(ledgersLeft: number): string {
  if (ledgersLeft <= 0) return "Auction ended";
  const seconds = ledgersLeft * 5; // ~5s per ledger on testnet, approximate
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `~${secs}s left`;
  return `~${mins}m ${secs}s left`;
}

interface Props {
  state: AuctionState | null;
  address: string | null;
  disabled: boolean;
  onBid: (amount: number) => void;
}

export function AuctionCard({ state, address, disabled, onBid }: Props) {
  const [amount, setAmount] = useState("");

  if (!state) {
    return <div className="auction-card empty-state">Loading auction…</div>;
  }

  const minBid = state.highestBid > 0 ? state.highestBid + 1 : state.startingPrice;
  const ledgersLeft = state.endLedger - state.currentLedger;
  const isEnded = state.ended;
  const youAreLeading = address && state.highestBidder === address;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value < minBid) return;
    onBid(value);
    setAmount("");
  };

  return (
    <div className="auction-card">
      <div className="auction-header">
        <h2>{state.itemName}</h2>
        <span className={`badge ${isEnded ? "badge-ended" : "badge-live"}`}>
          {isEnded ? "Ended" : formatRemaining(ledgersLeft)}
        </span>
      </div>

      <div className="bid-display">
        <span className="bid-label">Current highest bid</span>
        <span className="bid-amount">
          {state.highestBid > 0 ? `${state.highestBid} ${AMOUNT_LABEL}` : "No bids yet"}
        </span>
        {state.highestBidder && (
          <span className="bid-leader">
            {youAreLeading ? "You're leading! 🎉" : `Leader: ${shorten(state.highestBidder)}`}
          </span>
        )}
      </div>

      <p className="starting-price">Starting price: {state.startingPrice} {AMOUNT_LABEL}</p>

      {!isEnded && (
        <form className="bid-form" onSubmit={handleSubmit}>
          <input
            type="number"
            placeholder={`Min ${minBid} ${AMOUNT_LABEL}`}
            value={amount}
            min={minBid}
            onChange={(e) => setAmount(e.target.value)}
            disabled={disabled || !address}
          />
          <button className="btn primary" type="submit" disabled={disabled || !address}>
            Place Bid
          </button>
        </form>
      )}

      {!address && <p className="poll-footer">Connect a wallet to bid.</p>}
    </div>
  );
}
