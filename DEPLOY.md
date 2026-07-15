# Deploying the contract to Stellar Testnet

You'll need the Rust toolchain + `stellar` CLI installed locally — this must
be run on your own machine, not in a sandboxed environment.

## 1. Install prerequisites

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown
cargo install --locked stellar-cli --features opt
```

## 2. Create and fund a deployer identity

```bash
stellar keys generate deployer --network testnet
stellar keys fund deployer --network testnet
stellar keys address deployer   # copy this — this is your admin address
```

## 3. Build the contract

```bash
cd contract
stellar contract build
# wasm output: target/wasm32-unknown-unknown/release/live_auction_contract.wasm
```

## 4. Deploy to testnet

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/live_auction_contract.wasm \
  --source deployer \
  --network testnet
```

Save the printed **Contract ID** (starts with `C...`).

## 5. Initialize the auction (one-time)

`duration_ledgers` is roughly 5 seconds per ledger on testnet — e.g. `720`
ledgers ≈ 1 hour, `120` ≈ 10 minutes (good for a quick demo).

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source deployer \
  --network testnet \
  -- \
  initialize \
  --admin <YOUR_ADMIN_ADDRESS> \
  --item_name "Vintage Synthesizer" \
  --starting_price 1000 \
  --duration_ledgers 720
```

## 6. Wire it into the frontend

```bash
cd ../frontend
cp .env.example .env
# edit .env and paste your CONTRACT_ID
npm install
npm run dev
```

## 7. Get a transaction hash for your README

Open the app, connect a wallet (e.g. Freighter on Testnet, funded via
https://friendbot.stellar.org), and place a bid. Copy the resulting tx hash
from the success banner or from Stellar Expert.

## 8. Verify on Stellar Expert

- Contract: `https://stellar.expert/explorer/testnet/contract/<CONTRACT_ID>`
- Transaction: `https://stellar.expert/explorer/testnet/tx/<TX_HASH>`
