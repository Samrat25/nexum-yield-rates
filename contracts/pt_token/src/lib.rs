#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Symbol};

// ──────────────────────────────────────────────────────────────────────────────
// Storage keys
// ──────────────────────────────────────────────────────────────────────────────
#[contracttype]
pub enum DataKey {
    Balance(Address),
    TotalSupply,
    Maturity,
    Admin,
    VaultContract,
    Name,
    TokenSymbol,
    Decimals,
}

// ──────────────────────────────────────────────────────────────────────────────
// Contract
// ──────────────────────────────────────────────────────────────────────────────
#[contract]
pub struct PtTokenContract;

#[contractimpl]
impl PtTokenContract {
    /// Initialize the PT token. Called once per tenor.
    /// `maturity_timestamp` is a Unix timestamp after which `is_matured()` returns true.
    pub fn initialize(
        env: Env,
        admin: Address,
        vault: Address,
        maturity_timestamp: u64,
        name: String,
        symbol: String,
    ) {
        admin.require_auth();
        env.storage().persistent().set(&DataKey::Admin, &admin);
        env.storage().persistent().set(&DataKey::VaultContract, &vault);
        env.storage().persistent().set(&DataKey::Maturity, &maturity_timestamp);
        env.storage().persistent().set(&DataKey::TotalSupply, &0i128);
        env.storage().persistent().set(&DataKey::Name, &name);
        env.storage().persistent().set(&DataKey::TokenSymbol, &symbol);
        env.storage().persistent().set(&DataKey::Decimals, &7u32);
    }

    /// Admin-only mint. Called by the Intent Router after intent execution.
    pub fn mint(env: Env, to: Address, amount: i128) {
        let admin: Address = env.storage().persistent().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        assert!(amount > 0, "Amount must be positive");

        let bal: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Balance(to.clone()))
            .unwrap_or(0);
        let supply: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0);

        env.storage()
            .persistent()
            .set(&DataKey::Balance(to.clone()), &(bal + amount));
        env.storage()
            .persistent()
            .set(&DataKey::TotalSupply, &(supply + amount));

        env.events()
            .publish((Symbol::new(&env, "mint"), to), amount);
    }

    /// Burn PT tokens from sender (called on redemption at maturity).
    pub fn burn(env: Env, from: Address, amount: i128) {
        from.require_auth();
        let bal: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Balance(from.clone()))
            .unwrap_or(0);
        assert!(bal >= amount, "Insufficient PT balance");

        let supply: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0);

        env.storage()
            .persistent()
            .set(&DataKey::Balance(from.clone()), &(bal - amount));
        env.storage()
            .persistent()
            .set(&DataKey::TotalSupply, &(supply - amount));

        env.events()
            .publish((Symbol::new(&env, "burn"), from), amount);
    }

    /// Transfer PT tokens between accounts.
    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();
        let from_bal: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Balance(from.clone()))
            .unwrap_or(0);
        assert!(from_bal >= amount, "Insufficient balance");

        let to_bal: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Balance(to.clone()))
            .unwrap_or(0);

        env.storage()
            .persistent()
            .set(&DataKey::Balance(from), &(from_bal - amount));
        env.storage()
            .persistent()
            .set(&DataKey::Balance(to), &(to_bal + amount));
    }

    pub fn balance(env: Env, id: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Balance(id))
            .unwrap_or(0)
    }

    pub fn total_supply(env: Env) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0)
    }

    /// Returns the Unix timestamp at which this PT batch matures.
    pub fn maturity(env: Env) -> u64 {
        env.storage().persistent().get(&DataKey::Maturity).unwrap()
    }

    /// Returns true once the ledger timestamp has passed the maturity date.
    pub fn is_matured(env: Env) -> bool {
        let maturity: u64 = env.storage().persistent().get(&DataKey::Maturity).unwrap();
        env.ledger().timestamp() >= maturity
    }

    pub fn name(env: Env) -> String {
        env.storage().persistent().get(&DataKey::Name).unwrap()
    }

    pub fn symbol(env: Env) -> String {
        env.storage()
            .persistent()
            .get(&DataKey::TokenSymbol)
            .unwrap()
    }

    pub fn decimals(_env: Env) -> u32 {
        7
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────
#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, String};

    fn setup() -> (soroban_sdk::Env, PtTokenContractClient<'static>) {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, PtTokenContract);
        let client = PtTokenContractClient::new(&env, &contract_id);
        (env, client)
    }

    #[test]
    fn test_mint_and_balance() {
        let (env, client) = setup();
        let admin = Address::generate(&env);
        let vault = Address::generate(&env);
        let user = Address::generate(&env);

        client.initialize(
            &admin,
            &vault,
            &9_999_999_999u64,
            &String::from_str(&env, "Nexum PT 30D"),
            &String::from_str(&env, "nPT30"),
        );

        client.mint(&user, &500_0000000i128);
        assert_eq!(client.balance(&user), 500_0000000i128);
        assert_eq!(client.total_supply(), 500_0000000i128);
    }

    #[test]
    fn test_burn() {
        let (env, client) = setup();
        let admin = Address::generate(&env);
        let vault = Address::generate(&env);
        let user = Address::generate(&env);

        client.initialize(
            &admin,
            &vault,
            &9_999_999_999u64,
            &String::from_str(&env, "Nexum PT 90D"),
            &String::from_str(&env, "nPT90"),
        );

        client.mint(&user, &1000_0000000i128);
        client.burn(&user, &400_0000000i128);
        assert_eq!(client.balance(&user), 600_0000000i128);
        assert_eq!(client.total_supply(), 600_0000000i128);
    }

    #[test]
    fn test_transfer() {
        let (env, client) = setup();
        let admin = Address::generate(&env);
        let vault = Address::generate(&env);
        let alice = Address::generate(&env);
        let bob = Address::generate(&env);

        client.initialize(
            &admin,
            &vault,
            &9_999_999_999u64,
            &String::from_str(&env, "Nexum PT 180D"),
            &String::from_str(&env, "nPT180"),
        );

        client.mint(&alice, &200_0000000i128);
        client.transfer(&alice, &bob, &80_0000000i128);
        assert_eq!(client.balance(&alice), 120_0000000i128);
        assert_eq!(client.balance(&bob), 80_0000000i128);
    }

    #[test]
    fn test_not_matured_yet() {
        let (env, client) = setup();
        let admin = Address::generate(&env);
        let vault = Address::generate(&env);

        client.initialize(
            &admin,
            &vault,
            &9_999_999_999u64, // far future
            &String::from_str(&env, "Nexum PT 30D"),
            &String::from_str(&env, "nPT30"),
        );

        assert!(!client.is_matured(), "Should not be matured yet");
    }
}
