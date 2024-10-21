import { NextRequest, NextResponse } from 'next/server';
import '@/lib/coinbase';
import { readContract } from '@coinbase/coinbase-sdk';

export async function POST(req: NextRequest) {
  try {
    const { contractAddress, abi, method, args, network } = await req.json();

    const result = await readContract({
      networkId: network,
      abi: abi,
      contractAddress: contractAddress as `0x${string}`,
      method: method,
      args: args,
    });

    console.log('result', result);
    const resultStr = JSON.stringify(result, (key, value) => {
      if (typeof value === "bigint") {
        return value.toString();
      }
      return value;
    });

    return NextResponse.json({ result: resultStr }, { 
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error reading contract:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
