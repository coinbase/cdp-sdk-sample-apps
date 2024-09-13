'use client';

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function AaveInteraction() {
    const [accountData, setAccountData] = useState<any>(null);
    const [supplyAmount, setSupplyAmount] = useState<string>('');
    const [borrowAmount, setBorrowAmount] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSupplying, setIsSupplying] = useState<boolean>(false);
    const [isBorrowing, setIsBorrowing] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const [supplyOutput, setSupplyOutput] = useState<{ amount: string, txHash: string } | null>(null);
    const [borrowOutput, setBorrowOutput] = useState<{ amount: string, txHash: string } | null>(null);

    const clearTransactionData = () => {
        setSupplyOutput(null);
        setBorrowOutput(null);
        setError('');
    };

    const getUserAccountData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/aave?action=getUserAccountData');
            if (!response.ok) throw new Error('Failed to fetch account data');
            const data = await response.json();
            setAccountData(data);
        } catch (err) {
            console.error('Failed to get user account data:', err);
            setError('Failed to fetch account data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const supplyToAave = async () => {
        if (!supplyAmount) return;
        clearTransactionData();
        setIsSupplying(true);
        try {
            const response = await fetch('/api/aave', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({action: 'supply', amount: supplyAmount}),
            });
            if (!response.ok) throw new Error('Failed to supply assets');
            const data = await response.json();
            setSupplyOutput({ amount: supplyAmount, txHash: data.txHash });
            getUserAccountData(); 
        } catch (err) {
            console.error('Failed to supply to Aave:', err);
            setError('Failed to supply assets. Please try again.');
        } finally {
            setIsSupplying(false);
        }
    };

    const borrowFromAave = async () => {
        if (!borrowAmount) return;
        clearTransactionData();
        setIsBorrowing(true);
        try {
            const response = await fetch('/api/aave', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({action: 'borrow', amount: borrowAmount}),
            });
            if (!response.ok) throw new Error('Failed to borrow assets');
            const data = await response.json();
            setBorrowOutput({ amount: borrowAmount, txHash: data.txHash });
            getUserAccountData(); 
        } catch (err) {
            console.error('Failed to borrow to Aave:', err);
            setError('Failed to borrow assets. Please try again.');
        } finally {
            setIsBorrowing(false);
        }
    };

    useEffect(() => {
        getUserAccountData();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-white to-lavender-100 text-gray-800">

            <div className="container mx-auto px-4 py-12">
                <h1 className="text-4xl font-semibold text-center mb-12 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    Aave V3 Interaction on Base Sepolia
                </h1>

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : (
                    <>
                        {accountData && (
                            <Card className="mb-8 bg-white shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-2xl text-blue-600">Account Overview</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="mb-2">Wallet Address: {accountData.walletAddress}</p>
                                    <p>Wallet Balance: {parseFloat(accountData.usdcBalance).toFixed(2)} USDC</p>
                                </CardContent>
                            </Card>
                        )}

                        <Card className="mb-8 bg-white shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-2xl text-blue-600">Aave Lending Pool</CardTitle>
                                <CardDescription>Interact with Aave lending pool</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {error && (
                                    <Alert variant="destructive" className="mb-4">
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}
                                <Button onClick={getUserAccountData} className="mb-4 bg-blue-600 hover:bg-blue-700 text-white">
                                    Refresh Account Data
                                </Button>                        
                                {accountData && (
                                <div className="bg-lavender-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold mb-2 text-blue-600">Account Data:</h3>
                                    <p className="mb-1">Total Deposited: {accountData.totalDeposited} USDC</p>
                                    <p className="mb-1">Total Debt: {accountData.totalDebtBase} USDC</p>
                                    <p className="mb-1">Available to borrow: {accountData.availableBorrowsBase} USDC</p>
                                    <p>Health Factor: {accountData.healthFactor}</p>
                                </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Card className="bg-white shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-2xl text-blue-600">Supply Assets</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Input
                                        type="number"
                                        placeholder="Amount to supply (USDC)"
                                        value={supplyAmount}
                                        onChange={(e) => {
                                            setSupplyAmount(e.target.value);
                                            clearTransactionData();
                                        }}
                                        className="mb-4"
                                    />
                                    <Button onClick={supplyToAave} disabled={isSupplying} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                        {isSupplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Supply to Aave
                                    </Button>
                                </CardContent>
                                {supplyOutput && (
                                    <CardFooter className="flex flex-col items-start">
                                        <p className="mb-2">Supplied Amount: {supplyOutput.amount} USDC</p>
                                        <p>Transaction Hash: {supplyOutput.txHash}</p>
                                    </CardFooter>
                                )}
                            </Card>

                            <Card className="bg-white shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-2xl text-blue-600">Borrow Assets</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Input
                                        type="number"
                                        placeholder="Amount to borrow (USDC)"
                                        value={borrowAmount}
                                        onChange={(e) => setBorrowAmount(e.target.value)}
                                        className="mb-4"
                                    />
                                    <Button onClick={borrowFromAave} disabled={isBorrowing} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                        {isBorrowing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Borrow from Aave
                                    </Button>
                                </CardContent>
                                {borrowOutput && (
                                    <CardFooter className="flex flex-col items-start">
                                        <p className="mb-2">Borrowed Amount: {borrowOutput.amount} USDC</p>
                                        <p>Transaction Hash: {borrowOutput.txHash}</p>
                                    </CardFooter>
                                )}
                            </Card>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}