import { importWallet } from '@/lib/coinbase';
import '@/lib/server/coinbase';
import { NextResponse } from 'next/server';

export type TransferResponse = {
  txHash: string;
  txUrl: string;
};

export async function POST(request: Request) {
  console.log('Starting POST request for NFT transfer');

  const body = await request.json();
  const { nftAddress, toAddress, tokenId } = body;

  console.log(`Received request to transfer NFT at address: ${nftAddress}`);

  if (!nftAddress || !toAddress || tokenId === undefined) {
    console.error('Missing required parameters');
    return NextResponse.json({ error: 'NFT address, recipient address, and token ID are required' }, { status: 400 });
  }

  try {
    console.log('Fetching wallet data from database');
    const wallet = await importWallet(0.0001);

    console.log('Initiating NFT transfer');
    console.log('Transfer arguments:');
    console.log('Contract Address:', nftAddress);
    console.log('From Address:', await wallet.getDefaultAddress().then(address => address.getId()));
    console.log('To Address:', toAddress);
    console.log('Token ID:', tokenId);
    console.log('Amount:', "1");
    console.log('Data:', "0x");
    const transferTx = await wallet.invokeContract({
      contractAddress: nftAddress,
      method: "safeTransferFrom",
      args: {
        from: await wallet.getDefaultAddress().then(address => address.getId()),
        to: "0x34da6d961CeE647db42EA566DC796c13F0A5cA94",
        id: tokenId.toString(),
        value: "1",
        data: "",
      },
    });

    console.log('Waiting for transfer transaction to be confirmed');
    await transferTx.wait();
    console.log('Transfer transaction confirmed');

    const transferResponse: TransferResponse = {
      txHash: transferTx.getTransaction().getTransactionHash() || "",
      txUrl: transferTx.getTransaction().getTransactionLink() || "",
    };

    console.log('Transfer Response:');
    console.log(`Transaction Hash: ${transferResponse.txHash}`);
    console.log(`Transaction URL: ${transferResponse.txUrl}`);

    console.log('NFT transfer process completed successfully');
    return NextResponse.json(transferResponse);
  } catch (error) {
    console.error('Error during NFT transfer process:', error);
    return NextResponse.json({ error: 'Failed to transfer NFT' }, { status: 500 });
  }
}
