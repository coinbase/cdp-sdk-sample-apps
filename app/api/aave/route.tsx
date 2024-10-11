import { NextResponse } from 'next/server';
import { baseSepolia } from 'viem/chains';
import aaveAbi from './aave_v3_abi.json';
import usdcAbi from './usdc_abi.json';
import { importWallet } from '@/lib/coinbase';

import {
    createPublicClient,
    http,
    parseAbi,
    parseUnits,
    formatUnits
} from 'viem';
import { Coinbase, Wallet } from "@coinbase/coinbase-sdk";

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
            totalCollateralBase: data[0],
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

    if (action === 'repay') {
        try {
            const amountToRepay = parseUnits(amount, 6);

            // First, approve USDC spend
            const approveContract = await wallet.invokeContract({
                contractAddress: USDC_ADDRESS,
                method: "approve",
                args: {
                    spender: AAVE_POOL_ADDRESS,
                    value: amountToRepay.toString()
                },
                abi: usdcAbi,
            });

            const approveTx = await approveContract.wait();
            if (!approveTx) {
                throw new Error('Failed to approve USDC spend');
            }

            console.log('USDC spend approved for repayment:', approveTx);

            // Now, repay the loan
            const repayContract = await wallet.invokeContract({
                contractAddress: AAVE_POOL_ADDRESS,
                method: "repay",
                args: {
                    asset: USDC_ADDRESS,
                    amount: amountToRepay.toString(),
                    interestRateMode: "2",
                    onBehalfOf: address.getId()
                },
                abi: aaveAbi,
            });

            const repayTx = await repayContract.wait();
            if (!repayTx) {
                throw new Error('Failed to repay USDC to Aave');
            }

            console.log('USDC repaid to Aave:', repayTx);

            return NextResponse.json({ success: true, txHash: repayTx.getTransactionHash() });
        } catch (error) {
            console.error('Failed to repay loan:', error);
            return NextResponse.json({
                error: 'Failed to repay loan',
                details: error instanceof Error ? error.message : String(error)
            }, { status: 500 });
        }
    }

    if (action === 'withdraw') {
        try {
            const amountToWithdraw = parseUnits(amount, 6); // Assuming USDC has 6 decimals

            console.log('Attempting to withdraw:', {
                asset: USDC_ADDRESS,
                amount: amountToWithdraw.toString(),
                to: address.getId()
            });

            const withdrawContract = await wallet.invokeContract({
                contractAddress: AAVE_POOL_ADDRESS,
                method: "withdraw",
                args: {
                    asset: USDC_ADDRESS,
                    amount: amountToWithdraw.toString(),
                    to: address.getId()
                },
                abi: aaveAbi,
            });

            const withdrawTx = await withdrawContract.wait();
            if (!withdrawTx) {
                throw new Error('Failed to withdraw USDC from Aave');
            }

            console.log('Withdraw transaction sent, hash:', withdrawTx.getTransactionHash());

            return NextResponse.json({ success: true, txHash: withdrawTx.getTransactionHash() });
        } catch (error) {
            console.error('Failed to withdraw:', error);
            return NextResponse.json({
                error: 'Failed to withdraw',
                details: error instanceof Error ? error.message : String(error)
            }, { status: 500 });
        }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
