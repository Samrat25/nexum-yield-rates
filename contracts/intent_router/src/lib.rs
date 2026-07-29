#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, IntoVal, Symbol, log};

// ──────────────────────────────────────────────────────────────────────────────
// Return types
// ──────────────────────────────────────────────────────────────────────────────

/// Returned by `execute_intent` on success.
#[contracttype]
pub struct IntentResult {
    pub pt_received: i128,
    pub locked_rate_bps: i128,
    pub maturity_timestamp: u64,
}

/// Returned by `quote_intent` for UI display.
#[contracttype]
pub struct Quote {
    pub pt_amount: i128,
    pub implied_rate_bps: i128,
    pub maturity_timestamp: u64,
    pub achievable: bool,
}

// ──────────────────────────────────────────────────────────────────────────────
// Storage keys
// ──────────────────────────────────────────────────────────────────────────────
#[contracttype]
pub enum DataKey {
    Admin,
    VaultContract,
    PtContract30d,
    PtContract90d,
    PtContract180d,
    TotalIntents,
}

// ──────────────────────────────────────────────────────────────────────────────
// Pure helper functions (also used in tests)
// ──────────────────────────────────────────────────────────────────────────────

/// Convert tenor in days → seconds.
pub fn tenor_to_seconds(tenor_days: u32) -> u64 {
    tenor_days as u64 * 86_400u64
}

/// Compute the annualised APY scaled to a specific tenor.
/// implied_rate = vault_apy_bps * tenor_days / 365
pub fn compute_implied_rate(vault_apy_bps: i128, tenor_days: u32) -> i128 {
    vault_apy_bps * tenor_days as i128 / 365
}

/// Compute the PT discount in bps. PT is issued at a discount so that
/// it matures to par (1 USDC). This mirrors Pendle's PT pricing.
///   discount_bps = rate / (1 + rate)   (expressed in bps)
pub fn compute_pt_discount(vault_apy_bps: i128, tenor_days: u32) -> i128 {
    let rate = compute_implied_rate(vault_apy_bps, tenor_days);
    // Avoid division by zero
    if rate == 0 {
        return 0;
    }
    // discount_bps = rate * 10_000 / (10_000 + rate)
    rate * 10_000 / (10_000 + rate)
}

// ──────────────────────────────────────────────────────────────────────────────
// Contract
// ──────────────────────────────────────────────────────────────────────────────
#[contract]
pub struct IntentRouterContract;

#[contractimpl]
impl IntentRouterContract {
    /// Initialize the router with vault + three PT token contracts (one per tenor).
    pub fn initialize(
        env: Env,
        admin: Address,
        vault: Address,
        pt_30d: Address,
        pt_90d: Address,
        pt_180d: Address,
    ) {
        admin.require_auth();
        env.storage().persistent().set(&DataKey::Admin, &admin);
        env.storage().persistent().set(&DataKey::VaultContract, &vault);
        env.storage().persistent().set(&DataKey::PtContract30d, &pt_30d);
        env.storage().persistent().set(&DataKey::PtContract90d, &pt_90d);
        env.storage().persistent().set(&DataKey::PtContract180d, &pt_180d);
        env.storage().persistent().set(&DataKey::TotalIntents, &0u64);
    }

    /// Read-only quote. Returns the implied rate and whether the target APR
    /// can be achieved at current vault conditions. Called every 3s by the UI.
    pub fn quote_intent(
        env: Env,
        usdc_amount: i128,
        target_rate_bps: i128,
        tenor_days: u32,
    ) -> Quote {
        assert!(
            tenor_days == 30 || tenor_days == 90 || tenor_days == 180,
            "Invalid tenor: must be 30, 90, or 180"
        );

        let vault_addr: Address = env
            .storage()
            .persistent()
            .get(&DataKey::VaultContract)
            .unwrap();

        // Cross-contract read: get vault APY in bps
        let vault_apy: i128 = env.invoke_contract(
            &vault_addr,
            &Symbol::new(&env, "get_apy_bps"),
            soroban_sdk::vec![&env],
        );

        let implied_rate = compute_implied_rate(vault_apy, tenor_days);
        let discount_bps = compute_pt_discount(vault_apy, tenor_days);
        let pt_amount = usdc_amount * (10_000 - discount_bps) / 10_000;
        let maturity = env.ledger().timestamp() + tenor_to_seconds(tenor_days);

        Quote {
            pt_amount,
            implied_rate_bps: implied_rate,
            maturity_timestamp: maturity,
            achievable: implied_rate >= target_rate_bps,
        }
    }

    /// Execute an intent atomically:
    ///   1. Check rate-or-revert condition
    ///   2. Deposit user USDC into vault (cross-contract call)
    ///   3. Mint discounted PT tokens to user
    ///
    /// If the implied rate < target, the entire transaction reverts. No funds move.
    pub fn execute_intent(
        env: Env,
        user: Address,
        usdc_amount: i128,
        target_rate_bps: i128,
        tenor_days: u32,
    ) -> IntentResult {
        user.require_auth();
        assert!(usdc_amount > 0, "Amount must be positive");
        assert!(
            tenor_days == 30 || tenor_days == 90 || tenor_days == 180,
            "Invalid tenor"
        );

        let vault_addr: Address = env
            .storage()
            .persistent()
            .get(&DataKey::VaultContract)
            .unwrap();

        let vault_apy: i128 = env.invoke_contract(
            &vault_addr,
            &Symbol::new(&env, "get_apy_bps"),
            soroban_sdk::vec![&env],
        );

        let implied_rate = compute_implied_rate(vault_apy, tenor_days);

        // ── RATE-OR-REVERT ─────────────────────────────────────────────────
        // This is the protocol's core guarantee. If the market can't deliver
        // the target APR, the transaction panics here and everything reverts.
        assert!(
            implied_rate >= target_rate_bps,
            "Rate-or-revert: market rate below target"
        );
        // ───────────────────────────────────────────────────────────────────

        // Step 1: deposit USDC into the vault (cross-contract)
        let _shares: i128 = env.invoke_contract(
            &vault_addr,
            &Symbol::new(&env, "deposit"),
            soroban_sdk::vec![
                &env,
                user.clone().into_val(&env),
                usdc_amount.into_val(&env)
            ],
        );

        // Step 2: select the right PT contract for the tenor
        let pt_addr: Address = match tenor_days {
            30 => env
                .storage()
                .persistent()
                .get(&DataKey::PtContract30d)
                .unwrap(),
            90 => env
                .storage()
                .persistent()
                .get(&DataKey::PtContract90d)
                .unwrap(),
            _ => env
                .storage()
                .persistent()
                .get(&DataKey::PtContract180d)
                .unwrap(),
        };

        // Step 3: compute discounted PT amount and mint to user
        let discount_bps = compute_pt_discount(vault_apy, tenor_days);
        let pt_amount = usdc_amount * (10_000 - discount_bps) / 10_000;

        env.invoke_contract::<()>(
            &pt_addr,
            &Symbol::new(&env, "mint"),
            soroban_sdk::vec![
                &env,
                user.clone().into_val(&env),
                pt_amount.into_val(&env)
            ],
        );

        // Track total intents executed (for dashboard metrics)
        let total: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::TotalIntents)
            .unwrap_or(0);
        env.storage()
            .persistent()
            .set(&DataKey::TotalIntents, &(total + 1));

        env.events().publish(
            (Symbol::new(&env, "intent_executed"), user.clone()),
            (usdc_amount, implied_rate, tenor_days),
        );

        log!(
            &env,
            "Intent executed: amount={} rate_bps={} tenor={}",
            usdc_amount,
            implied_rate,
            tenor_days
        );

        IntentResult {
            pt_received: pt_amount,
            locked_rate_bps: implied_rate,
            maturity_timestamp: env.ledger().timestamp() + tenor_to_seconds(tenor_days),
        }
    }

    /// Returns total number of intents executed across all users.
    pub fn get_total_intents(env: Env) -> u64 {
        env.storage()
            .persistent()
            .get(&DataKey::TotalIntents)
            .unwrap_or(0)
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────
#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_implied_rate_30d() {
        // 15.20% APY over 30 days → ~1.25% implied rate
        let implied = compute_implied_rate(1520, 30);
        assert_eq!(implied, 124, "1520 * 30 / 365 = 124 bps");
    }

    #[test]
    fn test_implied_rate_90d() {
        let implied = compute_implied_rate(1520, 90);
        assert_eq!(implied, 374, "1520 * 90 / 365 = 374 bps");
    }

    #[test]
    fn test_implied_rate_180d() {
        let implied = compute_implied_rate(1520, 180);
        assert_eq!(implied, 749, "1520 * 180 / 365 = 749 bps");
    }

    #[test]
    fn test_pt_discount_positive_and_reasonable() {
        let discount = compute_pt_discount(1520, 30);
        assert!(discount > 0, "Discount must be positive");
        assert!(discount < 10_000, "Discount must be < 100%");
    }

    #[test]
    fn test_pt_amount_less_than_usdc() {
        // PT tokens are issued at a discount: pt_amount < usdc_amount
        let vault_apy = 1520i128;
        let usdc = 100_0000000i128; // 100 USDC
        let discount = compute_pt_discount(vault_apy, 30);
        let pt = usdc * (10_000 - discount) / 10_000;
        assert!(pt < usdc, "PT amount must be less than USDC input (discounted)");
        assert!(pt > usdc * 98 / 100, "Discount for 30d should be small (< 2%)");
    }

    #[test]
    fn test_tenor_to_seconds() {
        assert_eq!(tenor_to_seconds(30), 2_592_000u64);
        assert_eq!(tenor_to_seconds(90), 7_776_000u64);
        assert_eq!(tenor_to_seconds(180), 15_552_000u64);
    }
}
