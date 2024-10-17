import { NextRequest, NextResponse } from 'next/server';
import '@/lib/coinbase';
import { readContract } from '@coinbase/coinbase-sdk';

export async function POST(req: NextRequest) {
  try {
    const { contractAddress, abi, method, args } = await req.json();

    console.log(abi)

    const result = await readContract({
      networkId: "base-sepolia",
      abi: abi,
      contractAddress: contractAddress as `0x${string}`,
      method: method,
      args: args,
    });

    console.log(result)
    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error reading contract:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

