
# This code showcases how to send mass payouts to a list of addresses using the Coinbase Developer Platform (CDP) SDK.
# Pay particular attention to how the wallet is persisted and created between runs.

import os
import json
from cdp import Cdp, Wallet
from decimal import Decimal
from dotenv import load_dotenv

# Automated Onchain Payments Template

# 1. Set the CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY environment variables

# 2. Specify the receiving addresses on Base Sepolia below. One is pre-populated
# as an example.
receiving_addresses = ["yuga.base.eth"]

# 3. Specify the amount of ETH to send to each address in the variable below.
transfer_amount = Decimal('0.000002')

# Constants
asset_id = "eth"
seed_file_name = "./encrypted_seed.json"
wallet_file_name = "./wallet.json"


# Create a sending Wallet
def create_sending_wallet():
    print("Creating wallet...")
    sending_wallet = Wallet.create()
    print(f"Wallet successfully created: {sending_wallet}")

    # Persist the wallet locally
    print("Persisting wallet...")
    wallet_id_string = json.dumps(sending_wallet.id)
    with open(wallet_file_name, 'w') as f:
        f.write(wallet_id_string)
    sending_wallet.save_seed(seed_file_name)
    print("Wallet successfully persisted.")

    sending_address = sending_wallet.default_address
    print(f"Default address for wallet: {sending_address}")
    print("Funding sending wallet...")
    return sending_wallet


# Import an existing wallet
def import_existing_wallet():
    print("Importing existing wallet...")
    # Get the wallet ID
    with open(wallet_file_name, 'r') as f:
        wallet_data = f.read()
    wallet_id = json.loads(wallet_data)

    # Get the wallet
    wallet = Wallet.fetch(wallet_id)

    # Load the seed on the wallet
    wallet.load_seed(seed_file_name)
    print(f"Imported existing wallet: {wallet_id}")

    # Fetch the addresses on the wallet
    wallet.addresses

    return wallet


# Attempts to fund a wallet if it does not have enough ETH
def maybe_fund_wallet(sending_wallet):
    eth_balance = sending_wallet.balance(asset_id)
    print(f"Current ETH balance: {eth_balance}")

    eth_required = transfer_amount * len(receiving_addresses)
    print(f"ETH required: {eth_required}")

    if eth_balance < eth_required:
        print(
            f"Need {eth_required} ETH; attempting to fund wallet with faucet. This may take ~1 minute..."
        )
        faucet_transaction = sending_wallet.faucet()
        print(
            f"Faucet transaction successfully completed: {faucet_transaction}")

        new_eth_balance = sending_wallet.balance(asset_id)
        print(f"New ETH balance: {new_eth_balance}")


# Send the payouts to the receiving addresses
def send_mass_payout(sending_wallet):
    if len(receiving_addresses) == 0:
        print("No receiving addresses specified; quitting.")
        return

    print("Beginning mass payouts...")
    for address in receiving_addresses:
        try:
            print(f"Sending to {address}...")
            transfer = sending_wallet.transfer(amount=transfer_amount,
                                               asset_id=asset_id,
                                               destination=address)
            transfer.wait()
            print(f"Transfer to {address} successful")
            print(f"Transaction link: {transfer.transaction_link}")
            print(f"Transaction hash: {transfer.transaction_hash}")
        except Exception as error:
            print(f"Error sending to {address}: {error}")


# Main function
def main():
    try:
        load_dotenv()  # Load environment variables from .env file

        api_key_name = os.environ.get('CDP_API_KEY_NAME')
        api_key_private_key = os.environ.get('CDP_API_KEY_PRIVATE_KEY')

        if not api_key_name or not api_key_private_key:
            raise ValueError(
                "CDP API Key Name or CDP API Key Private Key is missing")

        # Configure the CDP SDK
        private_key = api_key_private_key.replace('\\n', '\n')
        Cdp.configure(api_key_name, private_key)

        if os.path.exists(seed_file_name) and os.path.exists(wallet_file_name):
            print("Using existing wallet...")
            sending_wallet = import_existing_wallet()
        else:
            # Create a file with seed_file_name and add an empty JSON object to it
            with open(seed_file_name, 'w') as f:
                f.write('{}')
            sending_wallet = create_sending_wallet()

        maybe_fund_wallet(sending_wallet)
        send_mass_payout(sending_wallet)

        print("Finished sending mass payouts!")
    except Exception as error:
        print(f"Error in sending mass payouts: {error}")


# Run the main function
if __name__ == "__main__":
    main()
