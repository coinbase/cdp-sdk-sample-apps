import { Coinbase, Wallet } from "@coinbase/coinbase-sdk";

if (!process.env.CDP_API_KEY_NAME || !process.env.CDP_API_KEY_PRIVATE_KEY) {
  throw new Error("CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY must be set");
}

const { CDP_API_KEY_NAME, CDP_API_KEY_PRIVATE_KEY } = process.env;

const apiKeyString = CDP_API_KEY_PRIVATE_KEY as string;

Coinbase.configure({
  apiKeyName: CDP_API_KEY_NAME as string,
  privateKey: apiKeyString.replaceAll("\\n", "\n") as string,
});

/**
 * importWallet imports the CDP wallet from the environment variables, and
 * funds it with ETH and/or USDC if the balance of the wallet is less than the provided
 * amounts.
 * @param minEthBalance The minimum balance of ETH to maintain in the wallet.
 * @param minUsdcBalance The minimum balance of USDC to maintain in the wallet.
 * @returns The imported or created wallet.
 */
export async function importWallet(minEthBalance: number = 0, minUsdcBalance: number = 0): Promise<Wallet> {
  const { WALLET_DATA } = process.env;

  let wallet: Wallet;

  try {
    // Parse the wallet data
    const seedData = JSON.parse(WALLET_DATA || "{}");

    if (Object.keys(seedData).length === 0) {
      // Create a new wallet if WALLET_DATA is empty
      wallet = await Wallet.create();

      let exportData = await wallet.export()

      // Create and assign the new WALLET_DATA
      const newWalletData = JSON.stringify({ [exportData['walletId'] as string]: { 'seed': exportData['seed'] as string } });

      console.log(`Created new wallet: ${exportData['walletId']}`)

      process.env.WALLET_DATA = newWalletData;

      return wallet;
    } else {
      // Get the wallet id
      const walletId = Object.keys(seedData)[0];

      // Get the seed of the wallet
      const seed = seedData[walletId]?.seed;

      wallet = await Wallet.import({ seed, walletId });
    }

    // Maybe fund the wallet with USDC
    const currentUsdcBalance = await wallet.getBalance(Coinbase.assets.Usdc);
    if (currentUsdcBalance.lessThan(minUsdcBalance)) {
      let faucetTransaction = await wallet.faucet(Coinbase.assets.Usdc);
      console.log(`Faucet transaction for USDC: ${faucetTransaction}`);
    }

    // Maybe fund the wallet with ETH.
    const currentEthBalance = await wallet.getBalance(Coinbase.assets.Eth);
    if (currentEthBalance.lessThan(minEthBalance)) {
      let faucetTransaction = await wallet.faucet();
      console.log(`Faucet transaction for ETH: ${faucetTransaction}`);
    }

    return wallet;
  } catch (e) {
    console.log('Failed to import wallet:', e);
    throw e;
  }
}