#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, Symbol, log};

// ──────────────────────────────────────────────────────────────────────────────
// Storage keys
// ──────────────────────────────────────────────────────────────────────────────
#[contracttype]
pub enum DataKey {
    TotalShares,
    TotalAssets,
    ShareBalance(Address),
    UsdcToken,
    Admin,
    SimulatedApy,
}

// ──────────────────────────────────────────────────────────────────────────────
// Contract
// ──────────────────────────────────────────────────────────────────────────────
#[contract]
pub struct VaultContract;

#[contractimpl]
impl VaultContract {
    /// Initialize the vault with an admin, the USDC token address, and an
    /// initial simulated APY expressed in basis points (e.g. 1520 = 15.20%).
    pub fn initialize(env: Env, admin: Address, usdc_token: Address, initial_apy_bps: i128) {
        admin.require_auth();
        env.storage().persistent().set(&DataKey::Admin, &admin);
        env.storage().persistent().set(&DataKey::UsdcToken, &usdc_token);
        env.storage().persistent().set(&DataKey::TotalShares, &0i128);
        env.storage().persistent().set(&DataKey::TotalAssets, &0i128);
        env.storage().persistent().set(&DataKey::SimulatedApy, &initial_apy_bps);
        log!(&env, "Vault initialized with APY bps: {}", initial_apy_bps);
    }

    /// Deposit `amount` of USDC; returns the number of vault shares minted.
    /// Uses ERC-4626-style share pricing: shares = amount * total_shares / total_assets.
    /// On first deposit, shares are 1:1.
    pub fn deposit(env: Env, user: Address, amount: i128) -> i128 {
        user.require_auth();
        assert!(amount > 0, "Amount must be positive");

        let usdc: Address = env.storage().persistent().get(&DataKey::UsdcToken).unwrap();
        let token_client = token::Client::new(&env, &usdc);
        token_client.transfer(&user, &env.current_contract_address(), &amount);

        let total_assets: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::TotalAssets)
            .unwrap_or(0);
        let total_shares: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::TotalShares)
            .unwrap_or(0);

        let shares_to_mint = if total_shares == 0 || total_assets == 0 {
            amount // 1:1 on first deposit
        } else {
            amount * total_shares / total_assets
        };

        let user_shares: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::ShareBalance(user.clone()))
            .unwrap_or(0);

        env.storage()
            .persistent()
            .set(&DataKey::ShareBalance(user.clone()), &(user_shares + shares_to_mint));
        env.storage()
            .persistent()
            .set(&DataKey::TotalShares, &(total_shares + shares_to_mint));
        env.storage()
            .persistent()
            .set(&DataKey::TotalAssets, &(total_assets + amount));

        env.events().publish(
            (Symbol::new(&env, "deposit"), user),
            (amount, shares_to_mint),
        );

        shares_to_mint
    }

    /// Redeem `shares` for USDC. Returns the USDC amount transferred to the user.
    pub fn withdraw(env: Env, user: Address, shares: i128) -> i128 {
        user.require_auth();
        assert!(shares > 0, "Shares must be positive");

        let user_shares: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::ShareBalance(user.clone()))
            .unwrap_or(0);
        assert!(user_shares >= shares, "Insufficient shares");

        let total_assets: i128 = env.storage().persistent().get(&DataKey::TotalAssets).unwrap();
        let total_shares: i128 = env.storage().persistent().get(&DataKey::TotalShares).unwrap();
        let usdc_out = shares * total_assets / total_shares;

        env.storage()
            .persistent()
            .set(&DataKey::ShareBalance(user.clone()), &(user_shares - shares));
        env.storage()
            .persistent()
            .set(&DataKey::TotalShares, &(total_shares - shares));
        env.storage()
            .persistent()
            .set(&DataKey::TotalAssets, &(total_assets - usdc_out));

        let usdc: Address = env.storage().persistent().get(&DataKey::UsdcToken).unwrap();
        let token_client = token::Client::new(&env, &usdc);
        token_client.transfer(&env.current_contract_address(), &user, &usdc_out);

        env.events().publish(
            (Symbol::new(&env, "withdraw"), user),
            (shares, usdc_out),
        );

        usdc_out
    }

    /// Returns the current share price scaled by 1_000_000 (6 decimal places).
    /// E.g. 1_050_000 means 1 share = 1.05 USDC.
    pub fn get_share_price(env: Env) -> i128 {
        let total_assets: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::TotalAssets)
            .unwrap_or(0);
        let total_shares: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::TotalShares)
            .unwrap_or(0);
        if total_shares == 0 {
            return 1_000_000; // initial price 1:1
        }
        total_assets * 1_000_000 / total_shares
    }

    /// Returns the simulated vault APY in basis points (e.g. 1520 = 15.20%).
    pub fn get_apy_bps(env: Env) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::SimulatedApy)
            .unwrap_or(1520)
    }

    /// Returns the vault share balance for a user.
    pub fn get_share_balance(env: Env, user: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::ShareBalance(user))
            .unwrap_or(0)
    }

    /// Total Value Locked (total USDC deposited).
    pub fn get_tvl(env: Env) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::TotalAssets)
            .unwrap_or(0)
    }

    /// Admin-only: update the simulated APY.
    pub fn update_apy(env: Env, new_apy_bps: i128) {
        let admin: Address = env.storage().persistent().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        env.storage()
            .persistent()
            .set(&DataKey::SimulatedApy, &new_apy_bps);
        log!(&env, "APY updated to {} bps", new_apy_bps);
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────
#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::token;

    #[test]
    fn test_deposit_and_withdraw() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, VaultContract);
        let client = VaultContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        let token_admin = Address::generate(&env);

        let token_contract = env.register_stellar_asset_contract_v2(token_admin.clone());
        let usdc_id = token_contract.address();

        let token_client = token::StellarAssetClient::new(&env, &usdc_id);
        token_client.mint(&user, &1_000_0000000i128); // 1,000 USDC (7 decimals)

        client.initialize(&admin, &usdc_id, &1520i128);

        let shares = client.deposit(&user, &100_0000000i128); // 100 USDC
        assert!(shares > 0, "Should mint shares");

        let balance = client.get_share_balance(&user);
        assert_eq!(balance, shares, "Share balance should match");

        let usdc_back = client.withdraw(&user, &shares);
        assert!(usdc_back > 0, "Should receive USDC back");
        assert_eq!(usdc_back, 100_0000000i128, "Should get full deposit back");
    }

    #[test]
    fn test_share_price_initial() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, VaultContract);
        let client = VaultContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let usdc_id = Address::generate(&env);
        client.initialize(&admin, &usdc_id, &1520i128);

        let price = client.get_share_price();
        assert_eq!(price, 1_000_000, "Initial share price must be 1:1");
    }

    #[test]
    fn test_get_apy_bps() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, VaultContract);
        let client = VaultContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let usdc_id = Address::generate(&env);
        client.initialize(&admin, &usdc_id, &1520i128);

        assert_eq!(client.get_apy_bps(), 1520i128);
    }

    #[test]
    fn test_update_apy() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, VaultContract);
        let client = VaultContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let usdc_id = Address::generate(&env);
        client.initialize(&admin, &usdc_id, &1520i128);
        client.update_apy(&1800i128);

        assert_eq!(client.get_apy_bps(), 1800i128);
    }
}
