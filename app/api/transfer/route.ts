import { importWallet } from '@/lib/coinbase';
import '@/lib/coinbase';
import { NextResponse } from 'next/server';

export type TransferResponse = {
  txHash: string;
  txUrl: string;
};

// Endpoint to transfer an NFT.
export async function POST(request: Request) {
  console.log('Starting NFT transfer process');

  const body = await request.json();
  const { nftAddress, toAddress, tokenId } = body;

  if (!nftAddress || !toAddress || tokenId === undefined) {
    return NextResponse.json({ error: 'NFT address, recipient address, and token ID are required' }, { status: 400 });
  }

  try {
    const wallet = await importWallet(0.0001);

    const transferTx = await wallet.invokeContract({
      contractAddress: nftAddress,
      method: "safeTransferFrom",
      args: {
        from: await wallet.getDefaultAddress().then(address => address.getId()),
        to: toAddress,
        id: tokenId.toString(),
        value: "1",
        data: "",
      },
    });

    await transferTx.wait();

    const transferResponse: TransferResponse = {
      txHash: transferTx.getTransaction().getTransactionHash() || "",
      txUrl: transferTx.getTransaction().getTransactionLink() || "",
    };

    console.log('NFT transfer completed successfully');
    return NextResponse.json(transferResponse);
  } catch (error) {
    console.error('Error during NFT transfer process:', error);
    return NextResponse.json({ error: 'Failed to transfer NFT' }, { status: 500 });
  }
}
