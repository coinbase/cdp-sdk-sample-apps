This prompt is used to show how to add agent functionality to a Python-based AgentKit:


I want to add a new action to my Langchain toolkit. Here's what I need you to do:

1. I'll provide you with a description of the action I want to implement

2. Using the structure I define below supplemented by an example for adding toolkit actions, please generate ALL the required code and file changes needed

3. The code should follow the patterns shown in these examples:

Import the following files:

from cdp import Wallet
from cdp_langchain.tools import CdpTool


Action file structure:

```python

DESCRIPTIVE_PROMPT = """

Description of what this action does and when to use it.

"""

class ActionInput(BaseModel):

    parameter1: str = Field(

        description="Description of parameter1",

        example="Example value"
    )
def my_custom_action(parameter1: str) -> str:

    """
    Docstring describing the action.
    Args:
        parameter1: Description
    Returns:
        str: Description of return value
    """
    # Implementation

    return result

```

signMessageTool = CdpTool(
    name="my_custom_action",
    description=DESCRIPTIVE_PROMPT,
    cdp_agentkit_wrapper=cdp_agentkit_wrapper, # this should be whatever the instantiation of CdpAgentkitWrapper is, typically `agentkit`
    args_schema=ActionInput,
    func=my_custom_action,
)

Here's an example of what this looks like for adding message signing using the Coinbase Developer Platform SDK:

# Define a custom action example.

SIGN_MESSAGE_PROMPT = """
This tool will sign arbitrary messages using EIP-191 Signed Message Standard hashing.
"""

class SignMessageInput(BaseModel):
    """Input argument schema for sign message action."""

    message: str = Field(
        ...,
        description="The message to sign. e.g. `hello world`"
    )

def sign_message(wallet: Wallet, message: str) -> str: # note that wallets is an object, it should not be in quotes
    """Sign message using EIP-191 message hash from the wallet.

    Args:
        wallet (Wallet): The wallet to sign the message from.
        message (str): The message to hash and sign.

    Returns:
        str: The message and corresponding signature.

    """
    payload_signature = wallet.sign_payload(hash_message(message)).wait()

    return f"The payload signature {payload_signature}"


signMessageTool = CdpTool(
    name="sign_message",
    description=SIGN_MESSAGE_PROMPT,
    cdp_agentkit_wrapper=agentkit, # this should be whatever the instantiation of CdpAgentkitWrapper is
    args_schema=SignMessageInput,
    func=sign_message,
)

tools.append(signMessageTool)

Remember to:

- Include proper type hints

- Add detailed docstrings

- Include Field descriptions and examples in the Pydantic model

- Follow existing naming conventions

- Provide clear implementation details