#![cfg(test)]

use super::*;
use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::Env;

#[test]
fn test_full_auction_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, AuctionContract);
    let client = AuctionContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    client.initialize(&admin, &String::from_str(&env, "Vintage Synth"), &1000i128, &100u32);

    let state = client.get_state();
    assert_eq!(state.starting_price, 1000);
    assert_eq!(state.highest_bid, 0);
    assert!(!state.ended);

    client.place_bid(&alice, &1000i128);
    let state = client.get_state();
    assert_eq!(state.highest_bid, 1000);
    assert_eq!(state.highest_bidder, Some(alice.clone()));

    client.place_bid(&bob, &1500i128);
    let state = client.get_state();
    assert_eq!(state.highest_bid, 1500);
    assert_eq!(state.highest_bidder, Some(bob.clone()));
}

#[test]
fn test_low_bid_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, AuctionContract);
    let client = AuctionContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let alice = Address::generate(&env);

    client.initialize(&admin, &String::from_str(&env, "Item"), &1000i128, &100u32);

    let result = client.try_place_bid(&alice, &999i128);
    assert_eq!(result, Err(Ok(AuctionError::BidTooLow)));

    client.place_bid(&alice, &1200i128);
    let result = client.try_place_bid(&alice, &1100i128);
    assert_eq!(result, Err(Ok(AuctionError::BidTooLow)));
}

#[test]
fn test_bid_after_end_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, AuctionContract);
    let client = AuctionContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let alice = Address::generate(&env);

    client.initialize(&admin, &String::from_str(&env, "Item"), &1000i128, &10u32);

    env.ledger().with_mut(|l| l.sequence_number += 20);

    let result = client.try_place_bid(&alice, &2000i128);
    assert_eq!(result, Err(Ok(AuctionError::AuctionEnded)));
}

#[test]
fn test_admin_can_end_early() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, AuctionContract);
    let client = AuctionContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let alice = Address::generate(&env);

    client.initialize(&admin, &String::from_str(&env, "Item"), &1000i128, &1000u32);
    client.end_auction();

    let result = client.try_place_bid(&alice, &2000i128);
    assert_eq!(result, Err(Ok(AuctionError::AuctionEnded)));
}
