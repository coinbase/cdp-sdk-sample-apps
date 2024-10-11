// Usage: npx tsx scripts/deployContract.tsx

import { importWallet } from '@/lib/coinbase';
import { SmartContract } from '@coinbase/coinbase-sdk';

export async function deployContract(): Promise<SmartContract> {
  console.log('Starting contract deployment process');

  try {
    const wallet = await importWallet(0.01);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    console.log(`Base URL for NFT: ${baseUrl}`);

    console.log('Deploying NFT contract');
    const multiToken = await wallet.deployMultiToken({
      uri: `${baseUrl}/api/nft/{id}.json`,
    });
    console.log(`NFT contract deployed at address: ${multiToken.getContractAddress()}`);

    await multiToken.wait();

    console.log('Contract deployment completed successfully');
    console.log(`Contract Address: ${multiToken.getContractAddress()}`);
    console.log(`Deploy Transaction Hash: ${multiToken.getTransaction().getTransactionHash()}`);
    console.log(`Deploy Transaction URL: ${multiToken.getTransaction().getTransactionLink()}`);

    return multiToken;
  } catch (error) {
    console.error('Error during contract deployment process:', error);
    process.exit(1);
  }
}


