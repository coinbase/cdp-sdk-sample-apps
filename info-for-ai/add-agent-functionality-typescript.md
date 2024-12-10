This prompt is used to show how to add agent functionality to a Typescript-based AgentKit:

I want to add a new action to my Langchain toolkit. Here's what I need you to do:

1. I'll provide you with a description of the action I want to implement

2. Using the structure I define below supplemented by an example for adding toolkit actions, please generate ALL the required code and file changes needed

3. The code should follow the patterns shown in these examples:

Required Imports
```typescript
import { Wallet } from "@coinbase/coinbase-sdk";
import { CdpWrapper } from "@coinbase/cdp-agentkit-core";
import { CdpTool } from "@coinbase/cdp-langchain";
import { z } from "zod";
```
Action file structure:
```typescript
// Define the action's descriptive prompt
const DESCRIPTIVE_PROMPT = `
Detailed description of what this action does and when to use it.
`;

// Define the input schema using Zod
const ActionInput = z.object({
  parameter1: z.string().describe("Description of parameter1. e.g. 'Example value'"),
});

/**
 * Brief description of what the action does
 *
 * @param wallet - Description of the wallet parameter
 * @param parameter1 - Description of parameter1
 * @returns Description of what the function returns
 */
async function myCustomAction(wallet: Wallet, parameter1: string): Promise<string> {
  // Implementation
  return result;
}

// Create the CdpTool instance
const myCustomActionTool = new CdpTool(
  {
    name: "my_custom_action",
    description: DESCRIPTIVE_PROMPT,
    argsSchema: ActionInput,
    func: myCustomAction
  },
  agentkit  // this should be whatever the instantiation of CdpWrapper is
);

// Add the tool to your toolkit
tools.push(myCustomActionTool);

```

Here's a concrete example of implementing a message signing action:
```typescript
import { Wallet, hashMessage } from "@coinbase/coinbase-sdk";
import { CdpTool } from "@coinbase/cdp-langchain";
import { z } from "zod";

// Define the prompt for the sign message action
const SIGN_MESSAGE_PROMPT = `
This tool will sign arbitrary messages using EIP-191 Signed Message Standard hashing.
`;

// Define the input schema using Zod
const SignMessageInput = z.object({
  message: z.string().describe("The message to sign. e.g. `hello world`"),
});

/**
 * Signs a message using EIP-191 message hash from the wallet
 *
 * @param wallet - The wallet to sign the message from
 * @param message - The message to hash and sign
 * @returns The message and corresponding signature
 */
async function signMessage(wallet: Wallet, message: string): Promise<string> {
  const payloadSignature = await wallet.createPayloadSignature(hashMessage(message));
  return `The payload signature ${payloadSignature}`;
}

const signMessageTool = new CdpTool(
  {
    name: "sign_message",
    description: SIGN_MESSAGE_PROMPT,
    argsSchema: SignMessageInput,
    func: signMessage
  },
  agentkit
);

tools.push(signMessageTool);
```

Important Reminders:

Use proper TypeScript type annotations
Include detailed JSDoc comments with @param and @return tags
Define clear Zod schemas with descriptions and examples
Follow TypeScript naming conventions (camelCase for functions/variables, PascalCase for types)
Make functions async when dealing with wallet operations
Provide clear implementation details and error handling where appropriate
Use TypeScript's built-in Promise type for async operations
