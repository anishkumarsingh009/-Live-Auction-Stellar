# 🔨 Live Auction — Stellar White Belt Level 2

An on-chain, single-item English auction built on **Soroban** (Stellar smart
contracts), with a multi-wallet React frontend where the current high bid
updates **live** as bids come in — no refresh required.

> Built for White Belt Level 2: multi-wallet integration, contract
> deployment, and real-time event handling.

## ✨ Features → Requirements mapping

| Requirement | Where it lives |
|---|---|
| Multi-wallet integration | `frontend/src/lib/wallet.ts` — [StellarWalletsKit](https://github.com/Creit-Tech/Stellar-Wallets-Kit) with `allowAllModules()` (Freighter, xBull, Albedo, Lobstr, Hana, Rabet, WalletConnect, Ledger) |
| 3+ error types handled | `wallet.ts` → `WalletNotFoundError`, `UserRejectedError`, `InsufficientBalanceError`, `NetworkError`, `ContractCallError` (5 total) |
| Contract deployed on testnet | `contract/src/lib.rs` — see [Deployed contract](#deployed-contract) below |
| Contract called from frontend | `frontend/src/lib/contract.ts` — `placeBid()` and `endAuction()` build, simulate, sign, and submit real invocations |
| Reading + writing contract data | `get_state` (read) and `place_bid` / `end_auction` (writes) |
| Transaction status visible | `frontend/src/components/TxStatus.tsx` — building → pending → success/error, with a Stellar Expert link |
| Event listening / real-time sync | `frontend/src/lib/events.ts` — polls Soroban RPC `getEvents` for the contract's `bid` topic every 4s, plus an 8s state-poll safety net |
| 2+ meaningful commits | See commit history — contract, frontend, and docs were committed separately |

## 🏗️ Architecture

```
contract/            Soroban smart contract (Rust)
  src/lib.rs           Auction logic: initialize, place_bid, end_auction, get_state
  src/test.rs          Unit tests (full flow, low-bid rejection, expiry, admin-only end)

frontend/            Vite + React + TypeScript
  src/lib/wallet.ts    StellarWalletsKit wrapper + typed errors
  src/lib/contract.ts  Build/sign/submit transactions, poll tx status
  src/lib/events.ts    Real-time bid event subscription
  src/components/      WalletConnect, AuctionCard, TxStatusBanner
```

### How a bid flows through the system

1. User connects a wallet via the **StellarWalletsKit** modal (any supported
   wallet — this is the multi-wallet piece).
2. Frontend builds a `place_bid(bidder, amount)` invocation, simulates it via
   Soroban RPC, and asks the connected wallet to sign it.
3. Signed transaction is submitted; the UI shows **pending**, then polls
   `getTransaction` until it's **success** or **failed**.
4. The contract rejects bids that don't strictly beat the current highest
   (or the starting price, on the first bid) and rejects bids placed after
   the auction's end ledger.
5. On a successful bid, the contract emits a `bid` event. Every connected
   client is polling `getEvents` for that topic, so the leaderboard updates
   **live** for everyone watching — not just the bidder.

## 🧯 Error handling

| Error | Trigger | User sees |
|---|---|---|
| `WalletNotFoundError` | Selected wallet extension isn't installed | "X is not installed or could not be reached." |
| `UserRejectedError` | User declines the signing prompt | "You rejected the request in your wallet." |
| `InsufficientBalanceError` | Account lacks XLM for fee/reserve | "This account doesn't have enough XLM..." |
| `NetworkError` | RPC/Horizon unreachable or times out | "Could not reach the Stellar network..." |
| `ContractCallError` | Contract-level rejection (bid too low, auction ended, unauthorized `end_auction` call) | Raw contract error surfaced in the banner |

All errors render in a banner at the top of the app instead of failing
silently. The "End auction now" button is a deliberate way to trigger and
see the `Unauthorized`-style contract error live: any connected wallet can
click it, but only the admin address that called `initialize` will succeed —
everyone else gets a clear on-chain rejection.

## 🚀 Setup

### Prerequisites
- Node.js 18+
- Rust + `wasm32-unknown-unknown` target + `stellar-cli` (only needed if you
  want to redeploy the contract yourself — see [DEPLOY.md](./DEPLOY.md))
- A testnet-funded wallet (e.g. [Freighter](https://www.freighter.app/), get
  funds from https://friendbot.stellar.org)

### Run the frontend

```bash
cd frontend
cp .env.example .env      # paste in the CONTRACT_ID below
npm install
npm run dev
```

### Deploy your own contract (optional — a live one is already deployed)

Full step-by-step in [DEPLOY.md](./DEPLOY.md).

## 📌 Deployed contract

- **Network:** Stellar Testnet
- **Contract ID:** `PASTE_YOUR_DEPLOYED_CONTRACT_ID_HERE`
- **Explorer:** https://stellar.expert/explorer/testnet/contract/PASTE_YOUR_DEPLOYED_CONTRACT_ID_HERE

## 🔗 Example transaction (contract call)

- **Tx hash:** `PASTE_YOUR_TX_HASH_HERE`
- **Explorer:** https://stellar.expert/explorer/testnet/tx/PASTE_YOUR_TX_HASH_HERE

## 📸 Screenshots

> Add these once you've run the app locally.

**Wallet options available (StellarWalletsKit modal):**

`![wallet options](./docs/wallet-options.png)`

**Live bid updating in real time:**

`![live auction](./docs/live-auction.png)`

## 🌐 Live demo

`https://your-deployment.vercel.app` (optional)

## 🧪 Testing the contract

```bash
cd contract
cargo test
```

Covers: full bid flow, low-bid rejection, bidding after expiry, admin-only
early close.

## 📄 License

MIT
