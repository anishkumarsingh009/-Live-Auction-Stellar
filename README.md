<div align="center">
  
# 🔨 Live Auction — On-Chain Bidding

**A decentralized English auction application built on Stellar & Soroban smart contracts.**  
*Live Auction features a real-time bidding interface where the highest bid updates instantly for every participant. Every bid is a real on-chain transaction — fully verifiable on Stellar Expert.*

[![Stellar](https://img.shields.io/badge/Stellar-Soroban-blue.svg)](https://stellar.org/soroban)
[![Frontend](https://img.shields.io/badge/Frontend-Vite_React-black.svg)](https://vitejs.dev/)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black.svg?logo=vercel)](https://live-auction-stellar.vercel.app/)

### 🚀 [▶️ Live App](https://live-auction-stellar.vercel.app/)

</div>

<br />

## ✨ Key Features

1. **Multi-Wallet Integration:** Seamlessly supports multiple Stellar wallets like Freighter via StellarWalletsKit.
2. **Real-time Event Sync:** Polls the Soroban RPC; the auction state updates the instant a new bid lands on-chain, keeping all bidders in sync.
3. **Transaction Status Tracking:** Visual toast-like banner moving from building → simulating → pending → success/error.
4. **On-Chain Verification:** After bidding, users get a direct link to Stellar Expert to verify their transaction hash instantly.
5. **Smart Contract Validations:** Securely handles minimum bid increments, auction time limits, and admin-only authorizations natively on-chain.

---

## 📸 Application Showcase

### 1. 🏆 Successful Bid & Live Auction State
*The modern glassmorphic interface displays the current highest bid in real-time. When a bid succeeds, an animated banner confirms the transaction and links directly to the block explorer.*

![Successful Bid](images/sucess%20bid.png)

---

### 2. 🔗 On-Chain Transaction Verified on Stellar Expert
*Every bid is a real Soroban smart contract invocation. Users can inspect the full transaction detail — source account, fee, ledger number, and the exact `place_bid()` call — on Stellar Expert.*

**Sample Transaction:** [View Contract Interaction Hash](https://stellar.expert/explorer/testnet/tx/f24d322a00e5b412e617d7966f37d2690d17ee48ce6846c31fcc85d78ea7a230)

---

### 3. 👛 Wallet Connection Options
*Live Auction integrates multiple Stellar wallets via StellarWalletsKit. Users can easily connect their preferred wallet to cast their bids securely.*

![Wallet Options](images/wallet%20options.png)

---

## 🛠 Tech Stack
- **Frontend:** React + Vite, TypeScript, Vanilla CSS (Premium Glassmorphism UI)
- **Blockchain:** Stellar Network (Testnet)
- **Smart Contracts:** Rust (Soroban SDK)
- **Wallet Integration:** `@creit.tech/stellar-wallets-kit`
- **Deployment:** Vercel
