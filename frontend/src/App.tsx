import { useEffect, useRef, useState } from "react";
import { WalletConnect } from "./components/WalletConnect";
import { AuctionCard } from "./components/AuctionCard";
import { TxStatusBanner } from "./components/TxStatus";
import { getAuctionState, placeBid, endAuction, AuctionState, TxResult } from "./lib/contract";
import { subscribeToBidEvents } from "./lib/events";
import { CONTRACT_ID, EXPLORER_CONTRACT_URL } from "./lib/config";

export default function App() {
  const [address, setAddress] = useState<string | null>(null);
  const [state, setState] = useState<AuctionState | null>(null);
  const [tx, setTx] = useState<TxResult | null>(null);
  const [error, setError] = useState<{ type: string; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const refreshState = (addr: string) => {
    getAuctionState(addr)
      .then(setState)
      .catch((err) => setError({ type: "ContractCallError", message: (err as Error).message }));
  };

  useEffect(() => {
    if (!address) return;
    refreshState(address);
  }, [address]);

  // Real-time updates: subscribe to bid events, plus an 8s poll safety net.
  useEffect(() => {
    if (!address) return;

    unsubscribeRef.current?.();
    unsubscribeRef.current = subscribeToBidEvents(
      () => refreshState(address),
      (err) => console.warn("event stream error:", err.message)
    );

    const interval = setInterval(() => refreshState(address), 8000);

    return () => {
      unsubscribeRef.current?.();
      clearInterval(interval);
    };
  }, [address]);

  const handleBid = async (amount: number) => {
    if (!address) return;
    setError(null);
    setLoading(true);
    await placeBid(address, amount, (status) => {
      setTx(status);
      if (status.status === "success") {
        refreshState(address);
      }
      if (status.status === "error") {
        setError({ type: "TransactionError", message: status.error ?? "Unknown error" });
      }
      if (status.status === "success" || status.status === "error") {
        setLoading(false);
      }
    });
  };

  const handleEndAuction = async () => {
    if (!address) return;
    setError(null);
    setLoading(true);
    await endAuction(address, (status) => {
      setTx(status);
      if (status.status === "success") {
        refreshState(address);
      }
      if (status.status === "error") {
        setError({ type: "TransactionError", message: status.error ?? "Unknown error" });
      }
      if (status.status === "success" || status.status === "error") {
        setLoading(false);
      }
    });
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-content">
          <h1>Live Auction</h1>
          <p className="subtitle">
            On-chain English auction powered by a Soroban smart contract on Stellar Testnet.
          </p>
        </div>
        <WalletConnect
          address={address}
          onConnected={(addr) => {
            setAddress(addr || null);
            setError(null);
          }}
          onError={(err) => setError({ type: err.name, message: err.message })}
        />
      </header>

      {error && (
        <div className="error-banner">
          <strong>{error.type}:</strong> {error.message}
        </div>
      )}

      <TxStatusBanner tx={tx} />

      <AuctionCard state={state} address={address} disabled={loading} onBid={handleBid} />

      {address && state && !state.ended && (
        <button className="link-btn end-auction-btn" onClick={handleEndAuction} disabled={loading}>
          End auction now (admin only — non-admins will see an authorization error)
        </button>
      )}

      <footer className="app-footer">
        <a href={`${EXPLORER_CONTRACT_URL}/${CONTRACT_ID}`} target="_blank" rel="noreferrer">
          View contract on Stellar Expert ↗
        </a>
      </footer>
    </div>
  );
}
