import { NextResponse } from 'next/server';
import { baseSepolia } from 'viem/chains';
import aaveAbi from './aave_v3_abi.json';
import usdcAbi from './usdc_abi.json';

import {
    createPublicClient,
    http,
    parseAbi,
    parseUnits,
    formatUnits
} from 'viem';
import {Coinbase, Wallet} from "@coinbase/coinbase-sdk";

const AAVE_POOL_ADDRESS = '0x07eA79F68B2B3df564D0A34F8e19D9B1e339814b';
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

const AAVE_POOL_ABI = parseAbi([
    'function getUserAccountData(address user) view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)',
    'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)',
    'function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf)',
    'function getReserveData(address asset) view returns (  address reserve, uint256 liquidityRate, uint256 stableBorrowRate, uint256 variableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex)'
]);

const ERC20_ABI = parseAbi([
    'function balanceOf(address account) view returns (uint256)',
    'function approve(address spender, uint256 amount) external returns (bool)',
]);

const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http()
});

// getUserAccountData fetches the user's account data from the Aave pool.
async function getUserAccountData(address: string) {
    try {
        const [data, usdcBalance] = await Promise.all([
            publicClient.readContract({
                address: AAVE_POOL_ADDRESS,
                abi: AAVE_POOL_ABI,
                functionName: 'getUserAccountData',
                args: [address as `0x${string}`]
            }),
            publicClient.readContract({
                address: USDC_ADDRESS,
                abi: ERC20_ABI,
                functionName: 'balanceOf',
                args: [address as `0x${string}`]
            })
        ]);
        console.log("address ", address)

        return {
            totalCollateralBase: data[0],  // This is the user's total deposited amount
            totalDebtBase: data[1],
            availableBorrowsBase: data[2],
            currentLiquidationThreshold: data[3],
            ltv: data[4],
            healthFactor: data[5],
            usdcBalance: usdcBalance,
        };
    } catch (error) {
        console.error('Error calling getUserAccountData:', error);
        throw error;
    }
}

// GET handler for the API route.
export async function GET(request: Request) {
    console.log('GET request received');
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    console.log(`Action: ${action}`);

    if (action === 'getUserAccountData') {
        try {
            console.log('Attempting to get user account data');

            const wallet = await importWallet();
            if (!wallet) {
                throw new Error('Failed to import wallet');
            }

            const address = await wallet.getDefaultAddress();

            const data = await getUserAccountData(address.getId());
            console.log('User account data received:', data);

            const response = {
                totalDeposited: formatUnits(data.totalCollateralBase, 8),
                totalDebtBase: formatUnits(data.totalDebtBase, 8),
                availableBorrowsBase: formatUnits(data.availableBorrowsBase, 8),
                currentLiquidationThreshold: data.currentLiquidationThreshold.toString(),
                ltv: data.ltv.toString(),
                healthFactor: formatUnits(data.healthFactor, 18),
                usdcBalance: formatUnits(data.usdcBalance, 6),
                walletAddress: address.getId(),
            };
            console.log('Formatted response:', response);

            return NextResponse.json(response);
        } catch (error) {
            console.error('Failed to get user account data:', error);
            return NextResponse.json({
                error: 'Failed to fetch account data',
                details: error instanceof Error ? error.message : String(error)
            }, { status: 500 });
        }
    }

    console.log('Invalid action');
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

// POST handler for the API route.
export async function POST(request: Request) {
    const body = await request.json();
    const { action, amount } = body;
    const wallet = await importWallet();
    if (!wallet) {
        throw new Error('Failed to import wallet');
    }

    const address = await wallet.getDefaultAddress();

    console.log('Wallet imported successfully for address: ', address);


    if (action === 'supply') {
        try {
            const amountToSupply = parseUnits(amount, 6); // Assuming USDC has 6 decimals

            const args = {
                spender: AAVE_POOL_ADDRESS,
                value: amountToSupply.toString()
            };

            const approveContract = await wallet.invokeContract({
                contractAddress: USDC_ADDRESS,
                method: "approve",
                args: args,
                abi: usdcAbi,
            });

            // Wait for the contract invocation transaction to land on-chain.
            const approveTx = await approveContract.wait();
            if (!approveTx) {
                throw new Error('Failed to approve USDC spend');
            }

            console.log('USDC spend approved:', approveTx);

            // Now, supply the USDC to Aave.
            const supplyContract = await wallet.invokeContract({
                contractAddress: AAVE_POOL_ADDRESS,
                method: "supply",
                args: {
                    asset: USDC_ADDRESS,
                    amount: amountToSupply.toString(),
                    onBehalfOf: address.getId(),
                    referralCode: "0"
                },
                abi: aaveAbi,
            });

            const supplyTx = await supplyContract.wait();
            if (!supplyTx) {
                throw new Error('Failed to supply USDC to Aave');
            }

            console.log('USDC supplied to Aave:', supplyTx);

            return NextResponse.json({ txHash: supplyTx.getTransactionHash() });
        } catch (error) {
            console.error('Failed to supply to Aave:', error);
            return NextResponse.json({ error: 'Failed to supply assets' }, { status: 500 });
        }
    }

    if (action === 'borrow') {
        try {
            const amountToBorrow = parseUnits(amount, 6);

            console.log('Attempting to borrow:', {
                asset: USDC_ADDRESS,
                amount: amountToBorrow.toString(),
                interestRateMode: 2,
                referralCode: 0,
                onBehalfOf: address.getId()
            });

            const borrowContract = await wallet.invokeContract({
                contractAddress: AAVE_POOL_ADDRESS,
                method: "borrow",
                args: {
                    asset: USDC_ADDRESS,
                    amount: amountToBorrow.toString(),
                    interestRateMode: "2",
                    referralCode: "0",
                    onBehalfOf: address.getId()
                },
                abi: aaveAbi,
            });

            const borrowTx = await borrowContract.wait();
            if (!borrowTx) {
                throw new Error('Failed to supply USDC to Aave');
            }


            console.log('Borrow transaction sent, hash:', borrowTx.getTransactionHash());

            return NextResponse.json({ success: true, txHash: borrowTx.getTransactionHash() });
        } catch (error) {
            console.error('Failed to borrow:', error);
            return NextResponse.json({
                error: 'Failed to borrow',
                details: error instanceof Error ? error.message : String(error)
            }, { status: 500 });
        }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

// importWallet imports the CDP wallet from the environment variables.
async function importWallet(): Promise<Wallet>{
    const { CDP_API_KEY_NAME, CDP_API_PRIVATE_KEY, WALLET_DATA } = process.env;

    const apiKeyString = CDP_API_PRIVATE_KEY as string;

    new Coinbase({
        apiKeyName: CDP_API_KEY_NAME as string,
        privateKey: apiKeyString.replaceAll("\\n", "\n") as string,
    });

    try {
        // Parse the wallet data
        const seedData = JSON.parse(WALLET_DATA || "{}");

        // Get the wallet id
        const walletId = Object.keys(seedData)[0];


        // Get the seed of the wallet
        const seed = seedData[walletId]?.seed;

        // Import the wallet
        return Wallet.import({ seed, walletId });
    } catch (e) {
        console.log('Failed to import wallet:', e);
        throw e;
    }
}
