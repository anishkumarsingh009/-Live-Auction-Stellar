<div align="center">
  
# 🔨 Live Auction — On-Chain Stellar Bidding

**An on-chain, single-item English auction built on Stellar & Soroban smart contracts.**  
*Live Auction allows users to place bids and see real-time updates directly on the blockchain, with a multi-wallet integrated React frontend.*

[![Stellar](https://img.shields.io/badge/Stellar-Soroban-blue.svg)](https://stellar.org/soroban)
[![Vite](https://img.shields.io/badge/Frontend-Vite_React-black.svg)](https://vitejs.dev/)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black.svg?logo=vercel)](https://live-auction-stellar.vercel.app/)

### 🔗 [▶️ Live App](https://live-auction-stellar.vercel.app/)

</div>

<br />

## 🌟 Key Features

1. **On-Chain Bidding:** Securely place bids using smart contracts on the Stellar Testnet, guaranteeing transparency and immediate settlement.
2. **Real-time Synchronization:** View the highest bid and leaderboard updates instantly via Soroban RPC `getEvents`, no refresh required.
3. **Multi-Wallet Integration:** Seamlessly connect using Freighter, xBull, Albedo, Lobstr, Hana, Rabet, WalletConnect, or Ledger through StellarWalletsKit.
4. **Robust Error Handling:** Comprehensive wallet and contract error tracking ensuring smooth user experiences.

---

## 🚀 Smart Contract Deployment (Stellar Testnet)

The smart contract is live and deployed to the **Stellar Testnet**. All contract interactions use the native **XLM** token.

| Contract | Contract ID | Explorer |
|---|---|---|
| 🔨 **Live Auction** | `CBVAFG4BB6QJ3IQ2UPWV43TLR24BED73BG5JZBSMGDNN3B66QFWQVNJ7` | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CBVAFG4BB6QJ3IQ2UPWV43TLR24BED73BG5JZBSMGDNN3B66QFWQVNJ7) |

**Sample Transaction:** [View Contract Interaction Hash](https://stellar.expert/explorer/testnet/tx/efd6f429a574a4186d4b7fff7e24dba1e7b12ecfe512efaa21fd73d8012cd841)

---

## 📸 Screenshots

**Live Bid Updating in Real Time:**
<p align="center">
  <img src="docs/live-auction.png" width="80%" />
</p>

**Wallet Options Available (StellarWalletsKit):**
<p align="center">
  <img src="docs/wallet-options.png" width="80%" />
</p>

---

## 🛠️ Tech Stack

- **Smart Contracts:** Rust, Soroban SDK
- **Frontend:** Vite, React, TypeScript
- **Wallet Integration:** Freighter / Stellar Wallets Kit

## 📖 Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/anishkumarsingh009/-Live-Auction-Stellar.git
   cd -Live-Auction-Stellar
   ```

2. **Run Contract Tests:**
   ```bash
   cd contract
   cargo test
   ```

3. **Start the Frontend:**
   ```bash
   cd frontend
   cp .env.example .env
   npm install
   npm run dev
   ```
