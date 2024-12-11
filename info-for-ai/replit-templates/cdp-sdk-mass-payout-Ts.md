// This code showcases how to send mass payouts to a list of addresses using the Coinbase Developer Platform (CDP) SDK.
// Pay particular attention to how the wallet is persisted and created between runs.

import { Coinbase, Wallet, WalletAddress } from "@coinbase/coinbase-sdk";
import fs from "fs";

// Automated Onchain Payments Template
//
// 1. Set the API_KEY_NAME and API_KEY_PRIVATE_KEY environment variables
// in this repl using the Secrets tool.
// NOTE: You have to manually remove all newlines (\n)
// from the private key before setting it as an environment variable due
// to the way Replit parses them.
//
// 2. Specify the receiving addresses on Base Sepolia below. One is pre-populated
// as an example.

const receivingAddresses: string[] = ["yuga.base.eth"];

// 3. Specify the amount of ETH to send to each address in the variable below.
const transferAmount = 0.000002;

// 4. npm run build; npm run start.

// Constants.
const assetId = Coinbase.assets.Eth;
const seedFileName = "./encrypted_seed.json";
const walletFileName = "./wallet.json";

// Create a sending Wallet.
async function createSendingWallet(): Promise<Wallet> {
  console.log("Creating wallet...");
  const sendingWallet: Wallet = await Wallet.create();
  console.log(`Wallet successfully created: `, sendingWallet.toString());

  // Persist the wallet locally.
  console.log("Persisting wallet...");
  const walletIdString = JSON.stringify(sendingWallet.getId());
  fs.writeFileSync(walletFileName, walletIdString);
  sendingWallet.saveSeed(seedFileName);
  console.log("Wallet successfully persisted.");

  const sendingAddress: WalletAddress =
    await sendingWallet.getDefaultAddress()!;
  console.log(`Default address for wallet: `, sendingAddress.toString());
  console.log(`Funding sending wallet...`);
  return sendingWallet;
}

// Import an existing wallet.
async function importExistingWallet(): Promise<Wallet> {
  console.log("Importing existing wallet...");
  // Get the wallet ID.
  const walletData = fs.readFileSync(walletFileName, "utf8");
  const walletId = JSON.parse(walletData);

  // Get the wallet.
  const wallet = await Wallet.fetch(walletId);

  // Load the seed on the wallet.
  const successString = await wallet.loadSeed(seedFileName);
  console.log(successString);

  return wallet;
}

// Attempts to fund a wallet if it does not have enough ETH.
async function maybeFundWallet(sendingWallet: Wallet) {
  const ethBalance = await sendingWallet.getBalance(assetId);
  console.log(`Current ETH balance: ${ethBalance.toString()}`);

  const ethRequired = transferAmount * receivingAddresses.length;
  console.log(`ETH required: ${ethRequired.toString()}`);

  if (ethBalance.lt(ethRequired)) {
    console.log(
      `Need ${ethRequired} ETH; attempting to fund wallet with faucet. This may take ~1 minute...`,
    );
    const faucetTransaction = await sendingWallet.faucet();
    console.log(
      `Faucet transaction successfully completed: `,
      faucetTransaction.toString(),
    );

    const newEthBalance = await sendingWallet.getBalance(assetId);
    console.log(`New ETH balance: ${newEthBalance.toString()}`);
  }
}

// Send the payouts to the receiving addresses.
async function sendMassPayout(sendingWallet: Wallet): Promise<void> {
  if (receivingAddresses.length == 0) {
    console.log("No receiving addresses specified; quitting.");
    return;
  }

  console.log(`Beginning mass payouts...`);
  for (const address of receivingAddresses) {
    try {
      console.log(`Sending to ${address}...`);
      const transfer = await sendingWallet.createTransfer({
        amount: transferAmount,
        assetId: assetId,
        destination: address,
      });
      await transfer.wait();
      console.log(`Transfer to ${address} successful`);
      console.log(`Transaction link: ${transfer.getTransactionLink()}`);
      console.log(`Transaction hash: ${transfer.getTransactionHash()}`);
    } catch (error) {
      console.error(`Error sending to ${address}: `, error);
    }
  }
}

// Main function.
(async () => {
  try {
    if (!process.env.API_KEY_NAME || !process.env.API_KEY_PRIVATE_KEY) {
      throw new Error("API Key Name or API Key Private Key is missing");
    }

    // Configure the Coinbase SDK.
    const privateKey: string = process.env.API_KEY_PRIVATE_KEY.replace(
      /\\n/g,
      "\n",
    );
    Coinbase.configure({
      apiKeyName: process.env.API_KEY_NAME,
      privateKey: privateKey,
    });

    let sendingWallet: Wallet;

    if (fs.existsSync(seedFileName) && fs.existsSync(walletFileName)) {
      console.log(`Using existing wallet...`);
      sendingWallet = await importExistingWallet();
    } else {
      sendingWallet = await createSendingWallet();
    }

    await maybeFundWallet(sendingWallet);

    await sendMassPayout(sendingWallet);

    console.log("Finished sending mass payouts!");
  } catch (error) {
    console.error(`Error in sending mass payouts: `, error);
  }
})();
