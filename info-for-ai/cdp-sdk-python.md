# Comprehensive CDP SDK Python Reference

## Table of Contents
1. [Installation and Configuration](#installation-and-configuration)
2. [Wallet Management](#wallet-management)
3. [Address Operations](#address-operations)
4. [Transfers](#transfers)
5. [Trades](#trades)
6. [Smart Contract Interactions](#smart-contract-interactions)
7. [Token Deployments](#token-deployments)
8. [Message Signing](#message-signing)
9. [Faucet Operations](#faucet-operations)
10. [Balance Operations](#balance-operations)
11. [Transaction Status](#transaction-status)

## Installation and Configuration

### Installation

Install the CDP SDK using pip.

```bash
pip install cdp-sdk
```

### Importing the SDK

Import all components from the CDP SDK.

```python
from cdp import *
```

### Configuring the SDK

Configure the SDK with your API key credentials.

```python
Cdp.configure(api_key_name: str, api_key_private_key: str) -> None
```

- `api_key_name`: Your API key name
- `api_key_private_key`: Your API key's private key

Example:
```python
api_key_name = "Your API key name"
api_key_private_key = "Your API key's private key"
Cdp.configure(api_key_name, api_key_private_key)
```

Alternatively, configure from a JSON file.

```python
Cdp.configure_from_json(json_file_path: str) -> None
```

- `json_file_path`: Path to the JSON file containing your API key

Example:
```python
Cdp.configure_from_json("~/Downloads/cdp_api_key.json")
```

## Wallet Management

### Creating a Wallet

Create a new wallet on the default network (Base Sepolia testnet).

```python
Wallet.create(network_id: str = "base-sepolia") -> Wallet
```

- `network_id`: Optional network identifier (default is "base-sepolia")

Example:
```python
wallet = Wallet.create()
```

Create a wallet on Base Mainnet.

```python
Wallet.create(network_id: str = "base-mainnet") -> Wallet
```

Example:
```python
mainnet_wallet = Wallet.create(network_id="base-mainnet")
```

### Accessing Wallet Addresses

Get the default address of a wallet.

```python
wallet.default_address -> Address
```

Example:
```python
address = wallet.default_address
```

Create an additional address in the wallet.

```python
wallet.create_address() -> Address
```

Example:
```python
new_address = wallet.create_address()
```

List all addresses in the wallet.

```python
wallet.addresses -> List[Address]
```

Example:
```python
all_addresses = wallet.addresses
```

### Exporting and Importing Wallets

Export wallet data for persistence.

```python
wallet.export_data() -> WalletData
```

Example:
```python
wallet_data = wallet.export_data()
```

Save wallet seed to a file (for development only).

```python
wallet.save_seed(file_path: str, encrypt: bool = False) -> None
```

- `file_path`: Path to save the seed file
- `encrypt`: Whether to encrypt the seed (default is False)

Example:
```python
wallet.save_seed("my_seed.json", encrypt=True)
```

Import a previously exported wallet.

```python
Wallet.import_data(wallet_data: WalletData) -> Wallet
```

- `wallet_data`: Previously exported WalletData object

Example:
```python
imported_wallet = Wallet.import_data(wallet_data)
```

Fetch a wallet by ID.

```python
Wallet.fetch(wallet_id: str) -> Wallet
```

- `wallet_id`: ID of the wallet to fetch

Example:
```python
fetched_wallet = Wallet.fetch(wallet_id)
```

Load a saved wallet seed.

```python
wallet.load_seed(file_path: str) -> None
```

- `file_path`: Path to the saved seed file

Example:
```python
fetched_wallet.load_seed("my_seed.json")
```

## Address Operations

### Creating External Addresses

Create an External Address object.

```python
ExternalAddress(network_id: str, address: str) -> ExternalAddress
```

- `network_id`: Network identifier
- `address`: Address string

Example:
```python
external_address = ExternalAddress("base-sepolia", "0x123456789abcdef...")
```

### Viewing Address IDs

Get the hexadecimal string representation of an address.

```python
address.address_id -> str
```

Example:
```python
address_id = address.address_id
```

### Listing Address Historical Balances

View historical balances of an asset for an address.

```python
address.historical_balances(asset_id: str) -> List[Dict]
```

- `asset_id`: Asset identifier (e.g., "eth", "usdc")

Example:
```python
historical_balances = address.historical_balances("usdc")
```

### Listing Address Transactions

View all transactions for a specific address.

```python
address.transactions() -> List[Transaction]
```

Example:
```python
transactions = address.transactions()
```

## Transfers

### Performing a Transfer

Transfer an asset from one wallet to another.

```python
wallet.transfer(amount: Union[int, float, Decimal], asset_id: str, destination: Union[str, Address, Wallet], gasless: bool = False) -> Transfer
```

- `amount`: Amount to transfer
- `asset_id`: Asset identifier (e.g., "eth", "usdc")
- `destination`: Recipient's address, wallet, or ENS/Basename
- `gasless`: Whether to perform a gasless transfer (only for USDC, EURC, cbBTC on Base Mainnet)

Example:
```python
transfer = wallet.transfer(0.00001, "eth", another_wallet)
transfer.wait()
```

### Gasless Transfer

Perform a gasless transfer of USDC on Base Mainnet.

```python
mainnet_wallet.transfer(amount: Union[int, float, Decimal], asset_id: str, destination: Union[str, Address, Wallet], gasless: bool = True) -> Transfer
```

Example:
```python
gasless_transfer = mainnet_wallet.transfer(0.000001, "usdc", another_wallet, gasless=True)
gasless_transfer.wait()
```

### Transfer to ENS or Basename

Transfer assets to an ENS or Basename address.

```python
wallet.transfer(amount: Union[int, float, Decimal], asset_id: str, destination: str) -> Transfer
```

Example:
```python
ens_transfer = wallet.transfer(0.00001, "eth", "my-ens-name.base.eth")
ens_transfer.wait()
```

## Trades

### Performing a Trade

Trade one asset for another on Base Mainnet.

```python
wallet.trade(amount: Union[int, float, Decimal], from_asset_id: str, to_asset_id: str) -> Trade
```

- `amount`: Amount of the source asset to trade
- `from_asset_id`: Source asset identifier
- `to_asset_id`: Destination asset identifier

Example:
```python
trade = mainnet_wallet.trade(0.00001, "eth", "usdc")
trade.wait()
```

### Trading Full Balance

Trade the full balance of one asset for another.

```python
wallet.trade(amount: Union[int, float, Decimal], from_asset_id: str, to_asset_id: str) -> Trade
```

Example:
```python
trade2 = mainnet_wallet.trade(mainnet_wallet.balance("usdc"), "usdc", "weth")
trade2.wait()
```

## Smart Contract Interactions

### Invoking a Contract

Invoke a smart contract method.

```python
wallet.invoke_contract(contract_address: str, method: str, args: Dict[str, Any], abi: Optional[List[Dict]] = None) -> Invocation
```

- `contract_address`: Address of the smart contract
- `method`: Name of the method to invoke
- `args`: Arguments for the method
- `abi`: Optional ABI if not using a standard interface (ERC-20, ERC-721, ERC-1155)

Example (ERC-721 NFT transfer):
```python
invocation = wallet.invoke_contract(
    contract_address="0xYourNFTContractAddress",
    method="transferFrom",
    args={"from": "0xFrom", "to": "0xmyEthereumAddress", "tokenId": "1000"}
).wait()
```

Example (Arbitrary contract):
```python
abi = [
    {
        "inputs": [
            {"internalType": "address", "name": "to", "type": "address"},
            {"internalType": "uint256", "name": "value", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"internalType": "uint256", "name": '', "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]

invocation = wallet.invoke_contract(
    contract_address="0xYourContract",
    abi=abi,
    method="transfer",
    args={"to": "0xRecipient", "value": "1000"}
).wait()
```

## Token Deployments

### Deploying ERC-20 Token

Deploy an ERC-20 token contract.

```python
wallet.deploy_token(name: str, symbol: str, initial_supply: int) -> DeployedContract
```

- `name`: Name of the token
- `symbol`: Symbol of the token
- `initial_supply`: Initial token supply

Example:
```python
deployed_contract = wallet.deploy_token("ExampleCoin", "EXAM", 100000)
deployed_contract.wait()
```

### Deploying ERC-721 NFT

Deploy an ERC-721 NFT contract.

```python
wallet.deploy_nft(name: str, symbol: str, base_uri: str) -> DeployedContract
```

- `name`: Name of the NFT collection
- `symbol`: Symbol of the NFT collection
- `base_uri`: Base URI for token metadata

Example:
```python
deployed_nft = wallet.deploy_nft("My NFT", "MNFT", "https://my-nft-base-uri.com/metadata/")
deployed_nft.wait()
```

### Deploying ERC-1155 Multi-Token

Deploy an ERC-1155 Multi-Token contract.

```python
wallet.deploy_multi_token(uri: str) -> DeployedContract
```

- `uri`: URI for token metadata (should include `{id}` placeholder)

Example:
```python
deployed_multi_token = wallet.deploy_multi_token("https://example.com/{id}.json")
deployed_multi_token.wait()
```

## Message Signing

### EIP-191 Message Signing

Sign a message using EIP-191 standard.

```python
wallet.sign_payload(message_hash: str) -> SignedPayload
```

- `message_hash`: Hash of the message to sign

Example:
```python
message_hash = hash_messsage("hello world")
payload_signature = wallet.sign_payload(message_hash).wait()
```

### EIP-712 Typed Data Signing

Sign typed structured data using EIP-712 standard.

```python
wallet.sign_payload(typed_data_message_hash: str) -> SignedPayload
```

- `typed_data_message_hash`: Hash of the typed data message

Example:
```python
typed_data_message = {
    "types": {
        "MyType": [
            {"name": "sender", "type": "address"},
            {"name": "amount", "type": "uint256"}
        ]
    },
    "primaryType": "MyType",
    "domain": {
        "name": "MyDapp",
        "version": "1",
        "chainId": 1,
        "verifyingContract": "0xYourContractAddress"
    },
    "message": {
        "sender": "0xSenderAddress",
        "amount": 1000
    }
}
typed_data_message_hash = hash_typed_data_message(typed_data_message)
payload_signature = wallet.sign_payload(typed_data_message_hash).wait()
```

## Faucet Operations

### Requesting ETH from Faucet

Request ETH from the faucet on Base Sepolia testnet.

```python
wallet.faucet() -> FaucetTransaction
```

Example:
```python
faucet_tx = wallet.faucet()
```

### Requesting USDC from Faucet

Request USDC from the faucet on Base Sepolia testnet.

```python
wallet.faucet(asset_id: str = "usdc") -> FaucetTransaction
```

Example:
```python
faucet_tx = wallet.faucet(asset_id="usdc")
```

## Balance Operations

### Getting All Balances

Get all balances for a wallet.

```python
wallet.balances() -> Dict[str, Decimal]
```

Example:
```python
balances = wallet.balances()
```

### Getting Specific Asset Balance

Get the balance of a specific asset.

```python
wallet.balance(asset_id: str) -> Decimal
```

- `asset_id`: Asset identifier (e.g., "eth", "usdc") or contract address

Example:
```python
eth_balance = wallet.balance("eth")
token_balance = wallet.balance("0x036CbD53842c5426634e7929541eC2318f3dCF7e")
```

## Transaction Status

### Checking Transaction Status

Check the status of a transaction (Transfer or Trade).

```python
transaction.status -> Transaction.Status
```

Example:
```python
while transfer.status is Transaction.Status.PENDING:
    # Do something here
    time.sleep(1)
    transfer.reload()
```

### Waiting for Transaction Completion

Wait for a transaction to complete.

```python
transaction.wait() -> None
```

Example:
```python
transfer.wait()
```

from cdp.smart_contract import SmartContract

ABI = [    
    {
        "type": "function",
        "name": "pureUint16",
        "inputs": [],
        "outputs": [{"name": "", "type": "uint16"}],
        "stateMutability": "pure",
    }
]

CONTRACT_ADDRESS = "0x0B54409D1B1dd1438eDF7729CDAea3E331Ae12ED"
NETWORK_ID = "base-sepolia"

uint16 = SmartContract.read(
    NETWORK_ID,
    CONTRACT_ADDRESS,
    "pureUint16",
    ABI,
)

This comprehensive reference covers the main functionalities of the Coinbase Developer Platform SDK, providing detailed information about each function call, its parameters, and usage examples. This should serve as an extensive resource for an LLM to develop applications using the CDP SDK.