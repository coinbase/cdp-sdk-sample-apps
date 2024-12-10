#!/usr/bin/env python
# pyright: reportUnusedVariable=false, reportGeneralTypeIssues=false
# this code showcases how to create a Telegram bot using the Coinbase Developer Platform (CDP) SDK and Python.
"""

Hit RUN to execute the program.

You can also deploy a stable, public version of your project, unaffected by the changes you make in the workspace.

This proof-of-concept Telegram bot takes a user's text messages and turns them into stylish images. Utilizing Python, the `python-telegram-bot` library, and PIL for image manipulation, it offers a quick and interactive way to generate content.

Read the README.md file for more information on how to get and deploy Telegram bots.
"""

import logging
import json
import os
from telegram import __version__ as TG_VER
from telegram import CallbackQuery, Update, InlineKeyboardButton, InlineKeyboardMarkup, ForceReply
from telegram.ext import Application, CommandHandler, ContextTypes, CallbackQueryHandler, MessageHandler, filters
from telegram.error import BadRequest
from cdp import Cdp, Wallet, WalletData
import re
from decimal import Decimal
from replit import db
from web3 import Web3

try:
    from telegram import __version_info__
except ImportError:
    __version_info__ = (0, 0, 0, 0, 0)  # type: ignore[assignment]

if __version_info__ < (20, 0, 0, "alpha", 1):
    raise RuntimeError(
        f"This example is not compatible with your current PTB version {TG_VER}. To view the "
        f"{TG_VER} version of this example, "
        f"visit https://docs.python-telegram-bot.org/en/v{TG_VER}/examples.html"
    )

telegram_bot_token = os.environ['TELEGRAM_BOT_TOKEN']
cdp_api_key_name = os.environ['CDP_API_KEY_NAME']
cdp_api_key_private_key = os.environ['CDP_API_KEY_PRIVATE_KEY'].replace(
    '\\n', '\n')
encryption_key = os.environ['ENCRYPTION_KEY']

# Enable logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO)
# set higher logging level for httpx to avoid all GET and POST requests being logged
logging.getLogger("httpx").setLevel(logging.WARNING)

logger = logging.getLogger(__name__)


# TODO: This should be typed.
async def get_or_create_address(update: Update):
    """Get or create an address for the bot."""
    logging.info("Starting get_or_create_address function")
    user_id = str(update.effective_user.id)
    logging.info(f"User ID: {user_id}")

    if user_id in db:
        logging.info("User data found in db")
        # If user data exists in db, decrypt and import the wallet
        encrypted_data = db[user_id]
        logging.info("Retrieved encrypted data from db")
        stored_data = json.loads(encrypted_data)
        logging.info("Parsed stored data")
        decrypted_data = decrypt(stored_data['encrypted'], stored_data['iv'])
        logging.info("Decrypted data")
        wallet_data = WalletData.from_dict(decrypted_data)
        logging.info("Created WalletData object")
        wallet = Wallet.import_data(wallet_data)
        logging.info("Imported wallet data")
    else:
        logging.info("User data not found in db, creating new wallet")
        # If user data doesn't exist, create a new wallet
        wallet = Wallet.create("base-mainnet")
        logging.info("Created new wallet")
        wallet_data = wallet.export_data()
        logging.info("Exported wallet data")

        # Generate a new IV and encrypt the wallet data
        iv = os.urandom(16).hex()  # Generate a 16-byte IV and convert to hex
        logging.info("Generated new IV")
        encrypted_data = encrypt(wallet_data.to_dict(), iv)
        logging.info("Encrypted wallet data")

        # Save the encrypted wallet data and IV to db
        db[user_id] = json.dumps({'encrypted': encrypted_data, 'iv': iv})
        logging.info("Saved encrypted wallet data to db")

    logging.info("Returning wallet default address")
    return wallet.default_address


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a message when the command /start is issued."""
    try:
        address = await get_or_create_address(update)
    except Exception as e:
        await update.message.reply_text(f"Error: {str(e)}")
        return

    keyboard = [[
        InlineKeyboardButton("Check Balance", callback_data='check_balance'),
        InlineKeyboardButton("Deposit ETH", callback_data='deposit_eth')
    ],
                [
                    InlineKeyboardButton("Withdraw ETH",
                                         callback_data='withdraw_eth'),
                    InlineKeyboardButton("Buy", callback_data='buy')
                ],
                [
                    InlineKeyboardButton("Sell", callback_data='sell'),
                    InlineKeyboardButton("Export Key",
                                         callback_data='export_key')
                ],
                [
                    InlineKeyboardButton("Pin message",
                                         callback_data='pin_message')
                ]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(
        f"Welcome to your Onchain Trading Bot!\n"
        f"Your Base address is {address.address_id}\n"
        f"Select an option below:",
        reply_markup=reply_markup)


async def check_balance(update: Update) -> dict:
    """Get the balances for the wallet."""
    wallet = await get_or_create_address(update)
    return wallet.balances()


def is_valid_eth_address(address):
    # Check if it's a valid hexadecimal Ethereum address
    if Web3.is_address(address):
        return True

    # Check if it's a valid .base.eth or .eth domain
    if re.match(r'^[a-zA-Z0-9-]+\.base\.eth$', address) or re.match(
            r'^[a-zA-Z0-9-]+\.eth$', address):
        return True

    return False


async def handle_button_check_balance(update: Update,
                                      query: CallbackQuery) -> None:
    """Handle the 'Check Balance' button press."""
    await query.message.reply_text("Your balances are as follows:")
    try:
        balances = await check_balance(update)
        if len(balances) == 0:
            balance_message = "No balances."
        else:
            balance_message = "\n".join(
                [f"{token}: {amount}" for token, amount in balances.items()])
        await query.message.reply_text(balance_message)
    except Exception as e:
        await query.message.reply_text(f"Error retrieving balances: {str(e)}")


async def handle_button_deposit_eth(update: Update,
                                    query: CallbackQuery) -> None:
    """Handle the 'Deposit ETH' button press."""
    await query.message.reply_text(
        "Send your ETH to the following address on Base Mainnet:")
    try:
        wallet = await get_or_create_address(update)
        deposit_address = wallet.address_id
        await query.message.reply_text(deposit_address)
    except Exception as e:
        await query.message.reply_text(
            f"Error retrieving deposit address: {str(e)}")


async def handle_button_withdraw_eth(
        query: CallbackQuery, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle the 'Withdraw ETH' button press."""
    await query.message.reply_text("How much ETH would you like to withdraw?",
                                   reply_markup=ForceReply())
    context.user_data['awaiting_withdraw_amount'] = True


async def handle_button_export_key(update: Update,
                                   query: CallbackQuery) -> None:
    """Handle the 'Export Key' button press."""
    await query.message.reply_text(
        "The following contains your private key. Keep it somewhere private and do not share it with anyone."
    )
    try:
        wallet = await get_or_create_address(update, query)
        private_key = wallet.key.key.hex()
        await query.message.reply_text(f"`{private_key}`",
                                       parse_mode='MarkdownV2')
    except Exception as e:
        await query.message.reply_text(f"Error exporting private key: {str(e)}"
                                       )


async def handle_button_pin_message(
        query: CallbackQuery, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle the 'Pin message' button press."""
    try:
        await context.bot.pin_chat_message(chat_id=query.message.chat_id,
                                           message_id=query.message.message_id)
        await query.message.reply_text("Message pinned successfully!")
    except BadRequest as e:
        await query.message.reply_text(f"Failed to pin message: {str(e)}")


async def handle_button_buy(query: CallbackQuery,
                            context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle the 'Buy' button press."""
    await query.message.reply_text(
        "How much ETH would you like to spend on the buy?",
        reply_markup=ForceReply())
    context.user_data['awaiting_buy_amount'] = True


async def handle_button_sell(query: CallbackQuery,
                             context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle the 'Sell' button press."""
    await query.message.reply_text(
        "Which asset would you like to sell? (ticker or contract address)",
        reply_markup=ForceReply())
    context.user_data['awaiting_sell_asset'] = True


async def button(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handles button press and sends a new message."""
    query = update.callback_query
    await query.answer()

    if query.data == 'check_balance':
        await handle_button_check_balance(update, query)
    elif query.data == 'deposit_eth':
        await handle_button_deposit_eth(update, query)
    elif query.data == 'withdraw_eth':
        await handle_button_withdraw_eth(query, context)
    elif query.data == 'export_key':
        await handle_button_export_key(update, query)
    elif query.data == 'pin_message':
        await handle_button_pin_message(query, context)
    elif query.data == 'buy':
        await handle_button_buy(query, context)
    elif query.data == 'sell':
        await handle_button_sell(query, context)
    else:
        await query.message.reply_text(f"You selected {query.data}")


async def handle_withdraw_amount(update: Update,
                                 context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle the withdrawal amount input."""
    try:
        text = update.message.text.strip()
        if not re.match(r'^\d*\.?\d+$', text):
            raise ValueError("Invalid decimal format")
        amount = Decimal(text)
        wallet = await get_or_create_address(update)
        balance = Decimal(wallet.balance('eth'))

        if amount <= 0:
            await update.message.reply_text("Please enter a positive amount.")
        elif amount > balance:
            await update.message.reply_text(
                f"Insufficient balance. Your current ETH balance is {balance}."
            )
        else:
            context.user_data['withdraw_amount'] = amount
            context.user_data['awaiting_withdraw_address'] = True
            context.user_data['awaiting_withdraw_amount'] = False
            await update.message.reply_text(
                "Please enter the Ethereum address to withdraw to:",
                reply_markup=ForceReply())
    except ValueError:
        await update.message.reply_text(
            "Invalid amount. Please enter a valid number.")


async def handle_withdraw_address(update: Update,
                                  context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle the withdrawal address input."""
    address = update.message.text
    if is_valid_eth_address(address):
        amount = context.user_data['withdraw_amount']
        wallet = await get_or_create_address(update)

        waiting_message = await update.message.reply_text(
            "Waiting for withdrawal to complete...")

        try:
            transfer = wallet.transfer(amount, 'eth', address).wait()
            await context.bot.delete_message(
                chat_id=update.effective_chat.id,
                message_id=waiting_message.message_id)
            await update.message.reply_text(
                f"Withdrawal complete! Transaction link: {transfer.transaction_link}"
            )
        except Exception as e:
            await context.bot.delete_message(
                chat_id=update.effective_chat.id,
                message_id=waiting_message.message_id)
            await update.message.reply_text(f"Withdrawal failed: {str(e)}")

        context.user_data['awaiting_withdraw_address'] = False
        context.user_data.pop('withdraw_amount', None)
    else:
        await update.message.reply_text(
            "Invalid Ethereum address. Please enter a valid address.")


async def handle_buy_amount(update: Update,
                            context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle the buy amount input."""
    try:
        text = update.message.text.strip()
        if not re.match(r'^\d*\.?\d+$', text):
            raise ValueError("Invalid decimal format")
        amount = Decimal(text)
        wallet = await get_or_create_address(update)
        balance = Decimal(wallet.balance('eth'))

        if amount <= 0:
            await update.message.reply_text("Please enter a positive amount.")
        elif amount > balance:
            await update.message.reply_text(
                f"Insufficient balance. Your current ETH balance is {balance}."
            )
        else:
            context.user_data['buy_amount'] = amount
            context.user_data['awaiting_buy_asset'] = True
            context.user_data['awaiting_buy_amount'] = False
            await update.message.reply_text(
                "Please enter the asset you'd like to buy (ticker or contract address):",
                reply_markup=ForceReply())
    except ValueError:
        await update.message.reply_text(
            "Invalid amount. Please enter a valid number.")


async def handle_buy_asset(update: Update,
                           context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle the buy asset input."""
    asset = update.message.text
    amount = context.user_data['buy_amount']
    wallet = await get_or_create_address(update)

    waiting_message = await update.message.reply_text("Executing buy...")

    try:
        trade = wallet.trade(amount, 'eth', asset).wait()
        await context.bot.delete_message(chat_id=update.effective_chat.id,
                                         message_id=waiting_message.message_id)
        await update.message.reply_text(
            f"Buy successfully completed! Transaction link: {trade.transaction.transaction_link}"
        )
    except Exception as e:
        await context.bot.delete_message(chat_id=update.effective_chat.id,
                                         message_id=waiting_message.message_id)
        await update.message.reply_text(f"Buy failed: {str(e)}")

    context.user_data['awaiting_buy_asset'] = False
    context.user_data.pop('buy_amount', None)


async def handle_sell_asset(update: Update,
                            context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle the sell asset input."""
    asset = update.message.text
    context.user_data['sell_asset'] = asset
    context.user_data['awaiting_sell_asset'] = False
    context.user_data['awaiting_sell_amount'] = True
    await update.message.reply_text(
        f"How much {asset} would you like to sell?", reply_markup=ForceReply())


async def handle_sell_amount(update: Update,
                             context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle the sell amount input."""
    try:
        text = update.message.text.strip()
        if not text or not text.replace('.', '', 1).isdigit():
            raise ValueError("Invalid decimal format")
        amount = Decimal(text)
        asset = context.user_data['sell_asset']
        wallet = await get_or_create_address(update)
        balance = Decimal(wallet.balance(asset))

        if amount <= 0:
            await update.message.reply_text("Please enter a positive amount.")
        elif amount > balance:
            await update.message.reply_text(
                f"Insufficient balance. Your current {asset} balance is {balance}."
            )
        else:
            waiting_message = await update.message.reply_text(
                "Executing sell...")

            try:
                trade = wallet.trade(amount, asset, 'eth').wait()
                await context.bot.delete_message(
                    chat_id=update.effective_chat.id,
                    message_id=waiting_message.message_id)
                await update.message.reply_text(
                    f"Sell successfully completed! Transaction link: {trade.transaction.transaction_link}"
                )
            except Exception as e:
                await context.bot.delete_message(
                    chat_id=update.effective_chat.id,
                    message_id=waiting_message.message_id)
                await update.message.reply_text(f"Sell failed: {str(e)}")

            context.user_data['awaiting_sell_amount'] = False
            context.user_data.pop('sell_asset', None)
    except ValueError:
        await update.message.reply_text(
            "Invalid amount. Please enter a valid number.")


async def handle_message(update: Update,
                         context: ContextTypes.DEFAULT_TYPE) -> None:
    if context.user_data.get('awaiting_withdraw_amount'):
        await handle_withdraw_amount(update, context)
    elif context.user_data.get('awaiting_withdraw_address'):
        await handle_withdraw_address(update, context)
    elif context.user_data.get('awaiting_buy_amount'):
        await handle_buy_amount(update, context)
    elif context.user_data.get('awaiting_buy_asset'):
        await handle_buy_asset(update, context)
    elif context.user_data.get('awaiting_sell_asset'):
        await handle_sell_asset(update, context)
    elif context.user_data.get('awaiting_sell_amount'):
        await handle_sell_amount(update, context)


from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
import base64


def encrypt(data: dict, iv: str) -> str:
    """
    Encrypts the given data using AES-256 encryption.

    :param data: Dictionary containing the data to be encrypted
    :param iv: Initialization vector as a string
    :return: Encrypted data as a base64 encoded string
    """
    global encryption_key
    if not encryption_key:
        raise ValueError("ENCRYPTION_KEY environment variable is not set")

    key = bytes.fromhex(encryption_key)

    iv = bytes.fromhex(iv)

    json_data = json.dumps(data)

    cipher = AES.new(key, AES.MODE_CBC, iv)

    padded_data = pad(json_data.encode('utf-8'), AES.block_size)
    encrypted_data = cipher.encrypt(padded_data)

    result = base64.b64encode(encrypted_data).decode('utf-8')
    return result


def decrypt(encrypted_data: str, iv: str) -> dict:
    """
    Decrypts the given encrypted data using AES-256 decryption.

    :param encrypted_data: Base64 encoded encrypted data as a string
    :param iv: Initialization vector as a string
    :return: Decrypted data as a dictionary
    """
    global encryption_key
    if not encryption_key:
        logger.error("ENCRYPTION_KEY environment variable is not set")
        raise ValueError("ENCRYPTION_KEY environment variable is not set")

    key = bytes.fromhex(encryption_key)

    iv = bytes.fromhex(iv)

    encrypted_data = base64.b64decode(encrypted_data)

    cipher = AES.new(key, AES.MODE_CBC, iv)

    decrypted_data = cipher.decrypt(encrypted_data)

    unpadded_data = unpad(decrypted_data, AES.block_size)

    result = json.loads(unpadded_data.decode('utf-8'))
    return result


def main() -> None:
    """Start the bot."""
    # Initialize the CDP SDK
    Cdp.configure(cdp_api_key_name, cdp_api_key_private_key)

    # Create the Application and pass it your bot's token.
    application = Application.builder().token(telegram_bot_token).build()

    # on different commands - answer in Telegram
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CallbackQueryHandler(button))
    application.add_handler(
        MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    # Run the bot until the user presses Ctrl-C
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
