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
  console.log(`Importing wallet with minimum ETH balance: ${minEthBalance}, minimum USDC balance: ${minUsdcBalance}`);
  const { WALLET_DATA } = process.env;

  let wallet: Wallet;

  try {
    // Parse the wallet data
    const seedData = JSON.parse(WALLET_DATA || "{}");
    console.log(`Parsed wallet data. Found ${Object.keys(seedData).length} wallet(s)`);

    if (Object.keys(seedData).length === 0) {
      console.log('No existing wallet found. Creating a new wallet...');
      // Create a new wallet if WALLET_DATA is empty
      wallet = await Wallet.create();

      let exportData = await wallet.export()

      // Create and assign the new WALLET_DATA
      const newWalletData = JSON.stringify({ [exportData['walletId'] as string]: { 'seed': exportData['seed'] as string } });

      console.log(`Created new wallet: ${exportData['walletId']}`)

      console.log(`New WALLET_DATA: ${newWalletData}`);

      process.env.WALLET_DATA = newWalletData;

      return wallet;
    } else {
      console.log('Existing wallet found. Importing...');
      // Get the wallet id
      const walletId = Object.keys(seedData)[0];

      // Get the seed of the wallet
      const seed = seedData[walletId]?.seed;

      wallet = await Wallet.import({ seed, walletId });
      console.log(`Imported existing wallet with ID: ${walletId}`);
    }

    console.log(`Wallet address: ${await wallet.getDefaultAddress()}`);

    // Maybe fund the wallet with USDC
    const currentUsdcBalance = await wallet.getBalance(Coinbase.assets.Usdc);
    console.log(`Current USDC balance: ${currentUsdcBalance}`);
    if (currentUsdcBalance.lessThan(minUsdcBalance)) {
      console.log(`USDC balance below minimum. Funding wallet with USDC...`);
      let faucetTransaction = await wallet.faucet(Coinbase.assets.Usdc);
      console.log(`Faucet transaction for USDC: ${faucetTransaction}`);
    } else {
      console.log('USDC balance sufficient. No funding needed.');
    }

    // Maybe fund the wallet with ETH.
    const currentEthBalance = await wallet.getBalance(Coinbase.assets.Eth);
    console.log(`Current ETH balance: ${currentEthBalance}`);
    if (currentEthBalance.lessThan(minEthBalance)) {
      console.log(`ETH balance below minimum. Funding wallet with ETH...`);
      let faucetTransaction = await wallet.faucet();
      console.log(`Faucet transaction for ETH: ${faucetTransaction}`);
    } else {
      console.log('ETH balance sufficient. No funding needed.');
    }

    console.log('Wallet import and funding process completed successfully.');
    return wallet;
  } catch (e) {
    console.log('Failed to import wallet:', e);
    throw e;
  }
}