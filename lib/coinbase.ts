import { Coinbase } from "@coinbase/coinbase-sdk";

if (!process.env.CDP_API_KEY_NAME || !process.env.CDP_API_KEY_PRIVATE_KEY) {
  throw new Error("CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY must be set");
}

const { CDP_API_KEY_NAME, CDP_API_KEY_PRIVATE_KEY } = process.env;

const apiKeyString = CDP_API_KEY_PRIVATE_KEY as string;

Coinbase.configure({
  apiKeyName: CDP_API_KEY_NAME as string,
  privateKey: apiKeyString.replaceAll("\\n", "\n") as string,
});