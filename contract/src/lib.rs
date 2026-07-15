#![no_std]

//! Live Auction Contract
//!
//! Single-item English auction. Bids must strictly exceed the current
//! highest bid (or the starting price, if no bids yet) and must land before
//! the auction's end ledger. Emits a `bid` event on every accepted bid so a
//! frontend can show the leaderboard updating live.

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol};

const BID_EVENT: Symbol = symbol_short!("bid");

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    ItemName,
    StartingPrice,
    HighestBid,
    HighestBidder,
    EndLedger,
    Ended,
    Initialized,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AuctionState {
    pub item_name: String,
    pub starting_price: i128,
    pub highest_bid: i128,
    pub highest_bidder: Option<Address>,
    pub end_ledger: u32,
    pub current_ledger: u32,
    pub ended: bool,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum AuctionError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    AuctionEnded = 3,
    BidTooLow = 4,
    Unauthorized = 5,
    InvalidStartingPrice = 6,
}

#[contract]
pub struct AuctionContract;

#[contractimpl]
impl AuctionContract {
    /// One-time setup. `duration_ledgers` is roughly ~5s per ledger on
    /// testnet, so e.g. 720 ledgers ≈ 1 hour.
    pub fn initialize(
        env: Env,
        admin: Address,
        item_name: String,
        starting_price: i128,
        duration_ledgers: u32,
    ) -> Result<(), AuctionError> {
        if env.storage().instance().has(&DataKey::Initialized) {
            return Err(AuctionError::AlreadyInitialized);
        }
        if starting_price <= 0 {
            return Err(AuctionError::InvalidStartingPrice);
        }

        admin.require_auth();

        let end_ledger = env.ledger().sequence() + duration_ledgers;

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::ItemName, &item_name);
        env.storage()
            .instance()
            .set(&DataKey::StartingPrice, &starting_price);
        env.storage().instance().set(&DataKey::HighestBid, &0i128);
        env.storage()
            .instance()
            .set(&DataKey::HighestBidder, &None::<Address>);
        env.storage().instance().set(&DataKey::EndLedger, &end_ledger);
        env.storage().instance().set(&DataKey::Ended, &false);
        env.storage().instance().set(&DataKey::Initialized, &true);

        env.storage().instance().extend_ttl(500_000, 500_000);

        Ok(())
    }

    /// Place a bid. Must strictly exceed the current highest bid (or the
    /// starting price if this is the first bid), and the auction must still
    /// be open.
    pub fn place_bid(env: Env, bidder: Address, amount: i128) -> Result<(), AuctionError> {
        bidder.require_auth();

        if !env.storage().instance().has(&DataKey::Initialized) {
            return Err(AuctionError::NotInitialized);
        }

        let ended: bool = env.storage().instance().get(&DataKey::Ended).unwrap();
        let end_ledger: u32 = env.storage().instance().get(&DataKey::EndLedger).unwrap();
        if ended || env.ledger().sequence() >= end_ledger {
            return Err(AuctionError::AuctionEnded);
        }

        let highest_bid: i128 = env.storage().instance().get(&DataKey::HighestBid).unwrap();
        let starting_price: i128 = env
            .storage()
            .instance()
            .get(&DataKey::StartingPrice)
            .unwrap();
        let floor = if highest_bid > 0 { highest_bid } else { starting_price - 1 };

        if amount <= floor {
            return Err(AuctionError::BidTooLow);
        }

        env.storage().instance().set(&DataKey::HighestBid, &amount);
        env.storage()
            .instance()
            .set(&DataKey::HighestBidder, &Some(bidder.clone()));

        env.events().publish((BID_EVENT, bidder), amount);

        env.storage().instance().extend_ttl(500_000, 500_000);

        Ok(())
    }

    /// Admin-only: closes the auction early (e.g. once the seller is happy
    /// with the price). Auctions also auto-close once `end_ledger` passes,
    /// even without calling this.
    pub fn end_auction(env: Env) -> Result<(), AuctionError> {
        if !env.storage().instance().has(&DataKey::Initialized) {
            return Err(AuctionError::NotInitialized);
        }
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        env.storage().instance().set(&DataKey::Ended, &true);
        Ok(())
    }

    pub fn get_state(env: Env) -> AuctionState {
        let item_name: String = env.storage().instance().get(&DataKey::ItemName).unwrap();
        let starting_price: i128 = env
            .storage()
            .instance()
            .get(&DataKey::StartingPrice)
            .unwrap();
        let highest_bid: i128 = env.storage().instance().get(&DataKey::HighestBid).unwrap();
        let highest_bidder: Option<Address> = env
            .storage()
            .instance()
            .get(&DataKey::HighestBidder)
            .unwrap();
        let end_ledger: u32 = env.storage().instance().get(&DataKey::EndLedger).unwrap();
        let ended: bool = env.storage().instance().get(&DataKey::Ended).unwrap();
        let current_ledger = env.ledger().sequence();

        AuctionState {
            item_name,
            starting_price,
            highest_bid,
            highest_bidder,
            end_ledger,
            current_ledger,
            ended: ended || current_ledger >= end_ledger,
        }
    }
}

mod test;
