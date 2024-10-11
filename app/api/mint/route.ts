import { importWallet } from '@/lib/coinbase';
import '@/lib/coinbase';
import { NextResponse } from 'next/server';

export type MintResponse = {
  contractAddress: string;
  mintTxHash: string;
  mintTxUrl: string;
};

export async function POST(request: Request) {
  console.log('Starting POST request for minting');

  const body = await request.json();
  const { networkId, tokenId } = body;

  console.log(`Received request for network ID: ${networkId}`);

  if (networkId === undefined) {
    console.error('Network ID is missing in the request');
    return NextResponse.json({ error: 'Network ID is required' }, { status: 400 });
  }

  let mintResponse: MintResponse;

  try {
    const wallet = await importWallet(0.01);

    // If wallet does not have ETH, fund it.
    console.log('Checking wallet balance');
    const balance = await wallet.getBalance("eth");
    console.log(`Current wallet balance: ${balance.toString()} ETH`);
    if (balance.lessThan(0.01)) {
      console.log("Funding wallet with ETH");
      await wallet.faucet();
      console.log("Successfully funded wallet with ETH");
    } else {
      console.log("Wallet already has enough ETH, continuing.");
    }

    const baseUrl = `${process.env.NEXT_PUBLIC_BASE_URL || `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}`}`;
    console.log(`Base URL for NFT: ${baseUrl}`);

    // Mint 1 token to destinationAddress by calling invokeContract
    console.log('Minting NFTs');
    const defaultAddress = await wallet.getDefaultAddress();
    console.log(`Minting to address: ${defaultAddress.getId()}`);
    console.log(`NFT Contract Address: ${process.env.NFT_CONTRACT_ADDRESS}`);
    const mintTx = await wallet.invokeContract({
      contractAddress: process.env.NFT_CONTRACT_ADDRESS || "",
      method: "mint",
      args: {
        to: defaultAddress.getId(),
        id: tokenId,
        value: "1",
      },
    });

    console.log('Waiting for mint transaction to be confirmed');
    await mintTx.wait();
    console.log('Mint transaction confirmed');


    mintResponse = {
      contractAddress: process.env.NFT_CONTRACT_ADDRESS || "",
      mintTxHash: mintTx.getTransaction().getTransactionHash() || "",
      mintTxUrl: mintTx.getTransaction().getTransactionLink() || "",
    };

    console.log('Mint Response:');
    console.log(`Contract Address: ${mintResponse.contractAddress}`);
    console.log(`Mint Transaction Hash: ${mintResponse.mintTxHash}`);
    console.log(`Mint Transaction URL: ${mintResponse.mintTxUrl}`);

    console.log('Minting process completed successfully');
    return NextResponse.json(mintResponse);
  } catch (error) {
    console.error('Error during minting process:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 });
  }
}