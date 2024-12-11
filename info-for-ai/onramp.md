Introduction
Welcome to Coinbase Onramp! This demo app will get you up and running with a basic API integration with Coinbase Onramp.

Onramp initialization
Coinbase Onramp can be initialized two ways: via URL (non-secure) or via API (secure). In the URL method, all initialization parameters are passed as query string parameters. In the API method, the destination wallet address is passed via an API call which returns a one-time-use session token. The session token is then combined with the rest of the initialization parameters to generate an Onramp URL. See docs for more details.

Onramp APIs
Coinbase Onramp has several APIs that can be called from a backend server to support different types of integrations. The use cases they support include:

Creating session tokens
Generating quotes for onramp aggregation
Retrieving supported assets and payment methods in a given country
Note: an API integration is not required to use Onramp. The quickest way to use onramp is to pass all initialization parameters via query string parameter.

API keys
All of the Onramp APIs require a JWT bearer token. To generate JWTs you'll need to create an API key which can be created in the CDP portal. You can find example code to generate JWTs here.

Demo app
This repo includes a simple demo app which calls the session tokens API to generate an Onramp URL (i.e. the secure initialization method). Instructions: Enter an Ethereum address in the text box, click Generate secure token, and then launch Onramp with the generated URL.

How to run
First, download an API key from the CDP portal and drop it into the api_keys folder as cdp_api_key.json. Install dependencies by running yarn install. Then start the app by running yarn run dev and navigate to localhost:3000.


Buy config API:
import type { NextApiRequest, NextApiResponse } from "next";
import { createRequest, fetchOnrampRequest } from "./helpers";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const request_method = "GET";
  const { url, jwt } = await createRequest({
    request_method,
    request_path: "/onramp/v1/buy/config",
  });

  await fetchOnrampRequest({
    request_method,
    url,
    jwt,
    res,
  });
}

Buy options API:
import type { NextApiRequest, NextApiResponse } from "next";
import { createRequest, fetchOnrampRequest } from "./helpers";
import { BuyOptionsRequest } from "@/app/utils/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const reqBody = JSON.parse(req.body);
  const body: BuyOptionsRequest = {
    country: reqBody.country,
    subdivision: reqBody.subdivision,
  };

  const request_method = "GET";

  let { url, jwt } = await createRequest({
    request_method,
    request_path: "/onramp/v1/buy/options",
  });
  url = url + `?&country=${body.country}&subdivision=${body.subdivision}`;

  await fetchOnrampRequest({
    request_method,
    url,
    jwt,
    res,
  });
}

Buy quote API:
import type { NextApiRequest, NextApiResponse } from "next";
import { createRequest, fetchOnrampRequest } from "./helpers";

type BuyQuoteRequest = {
  purchase_currency: string;
  payment_amount: string;
  payment_currency: string;
  payment_method: string;
  country: string;
  purchase_network?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const request_method = "POST";
  const { url, jwt } = await createRequest({
    request_method,
    request_path: "/onramp/v1/buy/quote",
  });

  const reqBody = JSON.parse(req.body);
  const body: BuyQuoteRequest = {
    purchase_currency: reqBody.purchase_currency,
    payment_amount: reqBody.payment_amount,
    payment_currency: reqBody.payment_currency,
    payment_method: reqBody.payment_method,
    country: reqBody.country,
    purchase_network: reqBody.purchase_network,
  };

  await fetchOnrampRequest({
    request_method,
    url,
    jwt,
    body: JSON.stringify(body),
    res,
  });
}

Create transfer API:
import type { NextApiRequest, NextApiResponse } from "next";
import { fetchWallet } from "./helpers";
import { TimeoutError } from "@coinbase/coinbase-sdk";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const reqBody = JSON.parse(req.body);
  let { wallet } = await fetchWallet(reqBody.network);
  if (wallet != undefined) {
    console.log(
      `transfer ${reqBody.amount} ${reqBody.assetId.toLowerCase()} on ${
        reqBody.network
      } to ${reqBody.destination}`
    );
    let transfer = await wallet.createTransfer({
      amount: reqBody.amount,
      assetId: reqBody.assetId.toLowerCase(),
      destination: reqBody.destination,
      gasless: true,
    });

    // Wait for transfer to land on-chain.
    try {
      transfer = await transfer.wait();
    } catch (err) {
      if (err instanceof TimeoutError) {
        console.log("Waiting for transfer timed out");
      } else {
        console.error("Error while waiting for transfer to complete: ", err);
      }
    }

    // Check if transfer successfully completed on-chain
    if (transfer.getStatus() === "complete") {
      console.log("Transfer completed on-chain: ", transfer.toString());
    } else {
      console.error("Transfer failed on-chain: ", transfer.toString());
    }
    return res.json({
      id: transfer.getId(),
      status: transfer.getStatus(),
      txh: transfer.getTransactionLink(),
    });
  }
}

Create wallet API:
import type { NextApiRequest, NextApiResponse } from "next";
import { fetchWallet } from "./helpers";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const reqBody = JSON.parse(req.body);
  let { wallet } = await fetchWallet(reqBody.network_id);
  if (wallet != undefined) {
    let addresses = await wallet.listAddresses();
    let address = addresses[0].getId();
    // Get the wallet's balance.
    let balance = await wallet.listBalances();

    return res.json({
      wallet_address: addresses[0].getId(),
      network_id: addresses[0].getNetworkId(),
      balance: balance.toString(),
    });
  }
}

Helpers:
import { SignOptions, sign } from "jsonwebtoken";
import crypto from "crypto";
import { NextApiResponse } from "next";
import fs from "fs";
import { Coinbase, Wallet, CoinbaseOptions } from "@coinbase/coinbase-sdk";

export type createRequestParams = {
  request_method: "GET" | "POST";
  request_path: string;
};

export async function fetchApiCredentials() {
  const key = await import("../../api_keys/cdp_api_key.json");
  const key_name = key.name;
  const key_secret = key.privateKey;

  return { key_name, key_secret };
}

export async function createRequest({
  request_method,
  request_path,
}: createRequestParams) {
  const { key_name, key_secret } = await fetchApiCredentials();
  const host = "api.developer.coinbase.com";

  const url = `https://${host}${request_path}`;
  const uri = `${request_method} ${host}${request_path}`;

  const payload = {
    iss: "coinbase-cloud",
    nbf: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 120,
    sub: key_name,
    uri,
  };

  const signOptions: SignOptions = {
    algorithm: "ES256",
    header: {
      kid: key_name,
      nonce: crypto.randomBytes(16).toString("hex"), // non-standard, coinbase-specific header that is necessary
    },
  };

  const jwt = sign(payload, key_secret, signOptions);

  return { url, jwt };
}

type fetchOnrampRequestParams = {
  request_method: "GET" | "POST";
  url: string;
  jwt: string;
  body?: string;
  res: NextApiResponse;
};

export async function fetchOnrampRequest({
  request_method,
  url,
  jwt,
  body,
  res,
}: fetchOnrampRequestParams) {
  await fetch(url, {
    method: request_method,
    body: body,
    headers: { Authorization: "Bearer " + jwt },
  })
    .then((response) => {
      return response.json();
    })
    .then((json) => {
      if (json.message) {
        console.error("Error:", json.message);
        res.status(500).json({ error: json.message });
      } else {
        res.status(200).json(json);
      }
    })
    .catch((error) => {
      console.log("Caught error: ", error);
      res.status(500);
    });
}

export async function fetchWallet(network_id: string) {
  const { key_name, key_secret } = await fetchApiCredentials();
  const coinbaseOptions: CoinbaseOptions = {
    apiKeyName: key_name,
    privateKey: key_secret,
  };
  const coinbase = new Coinbase(coinbaseOptions);
  const seedFilePath = "wallet_seed/" + network_id + ".json";
  var wallet;
  if (!fs.existsSync(seedFilePath)) {
    console.log("Create Wallet");
    // Create your first wallet, default wallets created if for Base Sepolia
    let wallet = await Wallet.create({ networkId: network_id });

    let data = wallet.export();
    let jsonData = JSON.stringify(data);

    fs.writeFileSync(seedFilePath, jsonData);
    console.log(
      `Seed for wallet ${wallet.getId()} successfully saved to ${seedFilePath}.`
    );

    // Fund your wallet with ETH using a faucet.
    if (network_id == Coinbase.networks.BaseSepolia) {
      let faucetEthTransaction = await wallet.faucet();
      console.log(`Faucet transaction: ${faucetEthTransaction}`);
    }
  } else {
    console.log("Load Wallet");
    var fetchedData = JSON.parse(fs.readFileSync(seedFilePath, "utf8"));
    wallet = await Wallet.import({
      walletId: fetchedData.walletId,
      seed: fetchedData.seed,
    });
  }
  return { wallet };
}

Buy config box in tsx:
import { Button, Card, Link, Select, SelectItem } from "@nextui-org/react";
import {
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactJson from "react-json-view";
import { generateBuyConfig } from "../utils/queries";
import { BuyConfigResponse } from "../utils/types";

export function BuyConfigBox({
  buyConfig,
  setBuyConfig,
}: {
  buyConfig: BuyConfigResponse | undefined;
  setBuyConfig: Dispatch<SetStateAction<BuyConfigResponse | undefined>>;
}) {
  const [configLoading, setConfigLoading] = useState(false);

  const buyConfigHeaderRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    buyConfigHeaderRef.current = document.getElementById("buyConfigHeader");
  }, []);

  const buyConfigurationWrapper = async () => {
    try {
      setConfigLoading(true);
      const response = await generateBuyConfig();
      setConfigLoading(false);
      setBuyConfig(response);
    } catch (error) {
      setConfigLoading(false);
      alert(error);
    }
  };

  return (
    <Card id="buyConfigHeader" className="flex flex-col p-10">
      <h1
        className="font-bold mb-1"
        onClick={() =>
          buyConfigHeaderRef.current?.scrollIntoView({ behavior: "smooth" })
        }
      >
        {" "}
        1. Generate Buy Config:{" "}
      </h1>
      <h2>
        The{" "}
        <Link
          isExternal
          href="https://docs.cdp.coinbase.com/onramp/docs/api-configurations/#buy-config"
        >
          {" "}
          Buy Config API{" "}
        </Link>{" "}
        returns the list of countries supported by Coinbase Onramp Buy, and the
        payment methods available in each country.
      </h2>
      <div className="flex flex-row w-full justify-center gap-10 mt-5">
        <Button className="w-full" onClick={buyConfigurationWrapper}>
          {" "}
          Generate Buy Config{" "}
        </Button>
        <Card className="w-full p-5">
          {configLoading
            ? "loading..."
            : buyConfig && <ReactJson collapsed={true} src={buyConfig} />}
        </Card>
      </div>
    </Card>
  );
}

Buy quote box in TSX:
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Card, Link, Tooltip } from "@nextui-org/react";
import { Select, SelectItem } from "@nextui-org/select";
import {
  BuyConfigResponse,
  BuyOptionsRequest,
  BuyOptionsResponse,
  BuyQuoteRequest,
  BuyQuoteResponse,
} from "../utils/types";
import { generateBuyOptions, generateBuyQuote } from "../utils/queries";
import ReactJson from "react-json-view";
import { BuyConfigBox } from "./BuyConfigBox";
import SecureTokenBox from "./SecureTokenBox";

const emptyBuyQuoteParams: BuyQuoteRequest = {
  purchase_currency: "",
  payment_currency: "",
  payment_method: "",
  country: "",
  payment_amount: "",
  purchase_network: "",
};

export default function BuyQuoteBox() {
  /* refs to scroll to headers */
  const buyOptionsHeaderRef = useRef<HTMLDivElement | null>(null);
  const buyQuoteHeaderRef = useRef<HTMLDivElement | null>(null);

  /* Buy Configuration Response State */
  const [buyConfig, setBuyConfig] = useState<BuyConfigResponse>();

  /* Buy Options API Variables - Request & Response payloads, Loading state, List of country/subdiv options */
  // request parameters and onChange wrapper function
  const [buyOptionsParams, setBuyOptionsParams] = useState<BuyOptionsRequest>({
    country: "",
    subdivision: "",
  });
  const onChangeBuyOptionsParams = (e: ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBuyOptionsParams((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Buy Options API Response
  const [buyOptionsResponse, setBuyOptionsResponse] =
    useState<BuyOptionsResponse>();
  const prevCountrySubdiv = useRef("");
  const [isOptionsLoading, setIsOptionsLoading] = useState(false);

  /* Change list of buy option country options on re-render when config generated */
  const buy_options_countries = useMemo(() => {
    return buyConfig?.countries || [];
  }, [buyConfig]);
  const buy_options_subdivisions = useMemo(() => {
    return (
      buy_options_countries
        .find((country) => country.id === buyOptionsParams.country)
        ?.subdivisions.map((s) => {
          return { name: s };
        }) || []
    );
  }, [buy_options_countries, buyOptionsParams.country]);

  const [isQuoteLoading, setIsQuoteLoading] = useState(false);

  // Buy Quote Request Parameters & wrapper function to change parameter state
  const [buyQuoteParams, setBuyQuoteParams] =
    useState<BuyQuoteRequest>(emptyBuyQuoteParams);
  const onChangeBuyQuotesParams = (
    e: ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setBuyQuoteParams((prevState) => {
      return {
        ...prevState,
        [name]: value,
      };
    });
  };
  // Buy Quote Response
  const [buyQuoteResponse, setBuyQuoteResponse] = useState<BuyQuoteResponse>();

  /* Change list of payment methods on re-render when new PAYMENT currency is changed */
  const payment_methods_list = useMemo(() => {
    const methods = buyOptionsResponse?.payment_currencies
      .find((currency) => currency.id === buyQuoteParams.payment_currency)
      ?.limits.map((method) => ({ name: method.id }));
    return methods || [];
  }, [buyOptionsResponse, buyQuoteParams.payment_currency]);

  /* Change list of payment networks on re-render when new PURCHASE currency is changed */
  const purchase_networks_list = useMemo(() => {
    const networks = buyOptionsResponse?.purchase_currencies
      .find((currency) => currency.symbol === buyQuoteParams.purchase_currency)
      ?.networks.map((method) => ({ name: method.name }));
    return networks || [];
  }, [buyOptionsResponse, buyQuoteParams.purchase_currency]);

  /* Change payment amount limits on re-render when changing PAYMENT currency & PAYMENT METHOD */
  const payment_amount_limits = useMemo(() => {
    const limits = buyOptionsResponse?.payment_currencies
      .find((currency) => currency.id === buyQuoteParams.payment_currency)
      ?.limits.find((limit) => limit.id === buyQuoteParams.payment_method);
    return {
      min: limits?.min || "",
      max: limits?.max || "",
    };
  }, [
    buyOptionsResponse,
    buyQuoteParams.payment_currency,
    buyQuoteParams.payment_method,
  ]);

  /* Wrapper around buy options API call under api/buy-options-api
        - Calls and awaits the API with the current buyOptionsParams state
        - Sets the buyOptionsResponse state to API response, reset buyQuoteParams
        - handles error and loading states
    */
  const buyOptionsWrapper = useCallback(async () => {
    if (!buyOptionsParams.country) {
      // ensure country is selected
      alert("Please select a country to generate buy options!");
      return;
    }
    if (
      buyOptionsParams.country + buyOptionsParams.subdivision ===
      prevCountrySubdiv.current
    ) {
      // prevent re-fetching same data
      return;
    }

    try {
      // set loading state, reset current response
      setIsOptionsLoading(true);
      setBuyOptionsResponse(undefined);
      const response = await generateBuyOptions(buyOptionsParams);

      // set response, reset buy quote parameters,
      setBuyOptionsResponse(response?.json);
      setBuyQuoteParams({
        ...emptyBuyQuoteParams,
        country: buyOptionsParams.country,
      });

      // remove loading state and cache last country + subdivision query
      setIsOptionsLoading(false);
      prevCountrySubdiv.current =
        buyOptionsParams.country + buyOptionsParams.subdivision; // store current query params for future caching
    } catch (error) {
      // remove loading state and alert user of error
      setIsOptionsLoading(false);
      alert(error);
    }
  }, [buyOptionsParams]);

  /* Wrapper around buy quote API call under api/buy-quote-api
            - Calls and awaits the API with the current buyQuoteParams state
            - Sets the buyQuoteResponse state to API response
        */
  const buyQuoteWrapper = useCallback(async () => {
    if (
      !buyQuoteParams.purchase_currency ||
      !buyQuoteParams.payment_currency ||
      !buyQuoteParams.payment_method ||
      !buyQuoteParams.payment_amount ||
      !buyQuoteParams.country
    ) {
      alert("Please fill out all required fields");
      return;
    }

    const paymentAmount = parseInt(buyQuoteParams.payment_amount);
    const minPaymentAmount = parseInt(payment_amount_limits.min);
    const maxPaymentAmount = parseInt(payment_amount_limits.max);

    if (paymentAmount < minPaymentAmount || paymentAmount > maxPaymentAmount) {
      alert(
        `Payment amount for currency '${buyQuoteParams.payment_currency} - ${buyQuoteParams.payment_method}' must be between ${payment_amount_limits.min} and ${payment_amount_limits.max}`
      );
      return;
    }
    try {
      setIsQuoteLoading(true);
      setBuyQuoteResponse(undefined);
      const response = await generateBuyQuote(buyQuoteParams);
      setBuyQuoteResponse(response);
      setIsQuoteLoading(false);
    } catch (error) {
      setIsQuoteLoading(false);
      alert(error);
    }
  }, [buyQuoteParams, payment_amount_limits.max, payment_amount_limits.min]);

  return (
    <div className="flex flex-col w-full space-y-5">
      {/* Generate Buy Configurations Card Box */}
      <BuyConfigBox buyConfig={buyConfig} setBuyConfig={setBuyConfig} />

      {/* Buy Options Card Box */}
      <Card ref={buyOptionsHeaderRef} className="mt-5">
        {/* Buy Options Header */}
        <div className={`flex flex-col p-10 gap-1 ${buyConfig ? "pb-5" : ""}`}>
          <h1
            onClick={() =>
              buyOptionsHeaderRef.current?.scrollIntoView({
                behavior: "smooth",
              })
            }
            className="font-bold"
          >
            2. Generate Buy Options:
          </h1>
          <h2>
            {" "}
            The{" "}
            <Link
              href="https://docs.cdp.coinbase.com/onramp/docs/api-configurations/"
              isExternal
            >
              {" "}
              Buy Options API{" "}
            </Link>{" "}
            returns the supported fiat currencies and available crypto assets
            that can be passed into the Buy Quote API.{" "}
          </h2>
        </div>

        {buyConfig && (
          <div>
            <div className="flex flex-col ml-10 gap-1 w-2/5">
              <h2>
                {" "}
                1. Input your <b>country</b> and optionally the{" "}
                <b>subdivision</b>, then click{" "}
                <b>&lsquo;Generate Buy Options&rsquo;</b>.{" "}
              </h2>
              <h2>
                {" "}
                2. The response will show the payment and purchase options in
                your selected country/subdivision. Your selected country will be
                passed into the Buy Quote API.{" "}
              </h2>
            </div>
            {/* Buy Options API Request Parameters & Button to generate Buy Options */}
            <section className="flex flex-row gap-10 p-10">
              <div className="flex flex-col space-y-4 w-full">
                <h2 className="font-bold underline">
                  {" "}
                  Enter Request Parameters{" "}
                </h2>
                <Select
                  className="flex w-full"
                  name="country"
                  label="Country"
                  placeholder="Enter country of payment"
                  value={buyOptionsParams.country}
                  onChange={(value) => {
                    onChangeBuyOptionsParams(value);
                  }}
                  items={buy_options_countries}
                  isRequired
                  isDisabled={buyConfig.countries.length === 0}
                >
                  {(country) => (
                    <SelectItem key={country.id}>{country.id}</SelectItem>
                  )}
                </Select>
                <Select
                  className="flex w-full"
                  name="subdivision"
                  label="Subdivision"
                  placeholder="Enter subdivision (optional)"
                  value={buyOptionsParams.subdivision}
                  onChange={(value) => {
                    onChangeBuyOptionsParams(value);
                  }}
                  items={buy_options_subdivisions}
                  isDisabled={
                    buyOptionsParams.country === "" ||
                    buy_options_subdivisions.length === 0
                  }
                >
                  {(subdiv) => (
                    <SelectItem key={subdiv.name}>{subdiv.name}</SelectItem>
                  )}
                </Select>
                <Button
                  onClick={buyOptionsWrapper}
                  isDisabled={buyOptionsParams.country === ""}
                >
                  {" "}
                  Generate buy options{" "}
                </Button>
              </div>

              <div className="flex flex-col space-y-4 w-full">
                <h2 className="font-bold underline"> Buy Options Response </h2>
                <Card
                  className="flex-auto justify-top size-full p-5"
                  title="Buy Option Response"
                >
                  {isOptionsLoading
                    ? "loading..."
                    : buyOptionsResponse && (
                        <ReactJson collapsed={true} src={buyOptionsResponse} />
                      )}
                </Card>
              </div>
            </section>
          </div>
        )}
      </Card>

      {/* Generate Buy Quote Card Box */}
      <Card ref={buyQuoteHeaderRef} className="mt-5 flex flex-col">
        {/* Buy Quote Header */}
        <div
          className={`flex flex-col p-10 gap-1 ${
            buyOptionsResponse ? "pb-5" : ""
          }`}
        >
          <h1
            onClick={() =>
              buyQuoteHeaderRef.current?.scrollIntoView({ behavior: "smooth" })
            }
            className="font-bold"
          >
            {" "}
            3. Generate Buy Quote:{" "}
          </h1>
          <h2>
            The{" "}
            <Link
              href="https://docs.cdp.coinbase.com/onramp/docs/api-generating-quotes/"
              isExternal
            >
              {" "}
              Buy Quote API{" "}
            </Link>{" "}
            provides clients with a quote based on the asset the user would like
            to purchase, the network they plan to purchase it on, the dollar
            amount of the payment, the payment currency, the payment method, and
            country of the user.
          </h2>
        </div>

        {buyOptionsResponse && (
          <div>
            <div className="flex flex-col ml-10 gap-1 w-2/5">
              <h2>
                {" "}
                1. <b>&rsquo;Generate Buy Options&rsquo;</b> in the section
                above to specify the country parameter.{" "}
              </h2>
              <h2>
                {" "}
                2. Select a <b>payment currency</b>, then select a{" "}
                <b>payment method</b> based on the available options.{" "}
              </h2>
              <h2>
                {" "}
                3. Select a <b>purchase currency</b>, then optionally select a{" "}
                <b>purchase network</b>.{" "}
              </h2>
              <h2>
                {" "}
                4. Enter the <b>fiat payment amount</b> you wish to spend on
                this transaction. Then, click{" "}
                <b> &lsquo;Generate Buy Quote&rsquo; </b>.{" "}
              </h2>
              <h2>
                {" "}
                5. The <b>quoteID</b> and Buy Quote request parameters will be
                passed into your one-time Coinbase Onramp URL in the section
                below.
              </h2>
            </div>
            <section className="flex flex-row gap-10 p-10">
              {/* Country, Purchase Currency, Payment Currency, Payment Method, Network, Amount Options */}
              <div className="flex flex-col space-y-4 w-full">
                <h2 className="font-bold underline">
                  {" "}
                  Enter Request Parameters{" "}
                </h2>
                <Input
                  type="text"
                  label="Country"
                  placeholder="Generate buy options above"
                  disabled={true}
                  isRequired
                  value={buyQuoteParams.country}
                />

                <div className="flex flex-row justify-between gap-4">
                  <Tooltip
                    offset={-10}
                    content="Select country first"
                    isDisabled={buyQuoteParams.country !== ""}
                    placement="bottom"
                  >
                    <Select
                      className="flex w-full"
                      name="payment_currency"
                      label="Payment Currency"
                      placeholder="Select a payment currency"
                      onChange={(value) => {
                        onChangeBuyQuotesParams(value);
                      }}
                      isRequired
                      items={buyOptionsResponse?.payment_currencies || []}
                      isDisabled={buyQuoteParams.country === ""}
                    >
                      {(curr) => (
                        <SelectItem key={curr.id}>{curr.id}</SelectItem>
                      )}
                    </Select>
                  </Tooltip>
                  <Tooltip
                    offset={-10}
                    content="Select payment currency first"
                    isDisabled={buyQuoteParams.payment_currency !== ""}
                    placement="bottom"
                  >
                    <Select
                      className="flex w-full"
                      name="payment_method"
                      label="Payment Method"
                      placeholder="Select a payment method"
                      isRequired
                      isDisabled={buyQuoteParams.payment_currency === ""}
                      onChange={(value) => {
                        onChangeBuyQuotesParams(value);
                      }}
                      items={payment_methods_list}
                    >
                      {(method) => (
                        <SelectItem key={method.name}>{method.name}</SelectItem>
                      )}
                    </Select>
                  </Tooltip>
                </div>

                <div className="flex flex-row justify-between gap-4">
                  <Tooltip
                    offset={-10}
                    content="Select country first"
                    isDisabled={buyQuoteParams.country !== ""}
                    placement="bottom"
                  >
                    <Select
                      className="flex w-full"
                      name="purchase_currency"
                      label="Purchase Currency"
                      placeholder="Select a purchase currency"
                      isRequired
                      isDisabled={buyQuoteParams.country === ""}
                      onChange={(value) => {
                        onChangeBuyQuotesParams(value);
                      }}
                      items={buyOptionsResponse?.purchase_currencies || []}
                    >
                      {(curr) => (
                        <SelectItem key={curr.symbol}>{curr.symbol}</SelectItem>
                      )}
                    </Select>
                  </Tooltip>
                  <Tooltip
                    offset={-10}
                    content="Select purchase currency first"
                    isDisabled={buyQuoteParams.purchase_currency !== ""}
                    placement="bottom"
                  >
                    <Select
                      className="flex w-full"
                      name="purchase_network"
                      label="Purchase Network"
                      placeholder="Select purchase network (optional)"
                      onChange={(value) => {
                        onChangeBuyQuotesParams(value);
                      }}
                      items={purchase_networks_list}
                      isDisabled={buyQuoteParams.purchase_currency === ""}
                    >
                      {(network) => (
                        <SelectItem key={network.name}>
                          {network.name}
                        </SelectItem>
                      )}
                    </Select>
                  </Tooltip>
                </div>

                <Input
                  className="flex"
                  name="payment_amount"
                  type="text"
                  label="Payment Amount"
                  placeholder={
                    payment_amount_limits.max && payment_amount_limits.min
                      ? `Min Amt: ${payment_amount_limits.min}, Max Amt: ${payment_amount_limits.max}`
                      : "Enter amount of currency to purchase"
                  }
                  onChange={(value) => {
                    onChangeBuyQuotesParams(value);
                  }}
                  isRequired
                  isDisabled={
                    buyQuoteParams.payment_currency === "" ||
                    buyQuoteParams.payment_method === ""
                  }
                />

                {/* Generate Buy Quote Button */}
                <Button
                  onClick={buyQuoteWrapper}
                  className="w-min"
                  isDisabled={
                    buyQuoteParams.payment_currency === "" ||
                    buyQuoteParams.payment_method === "" ||
                    buyQuoteParams.purchase_currency === "" ||
                    buyQuoteParams.payment_amount === ""
                  }
                >
                  Generate buy quote
                </Button>
              </div>

              {/* Buy Quote Response */}
              <div className="flex flex-col space-y-4 w-full">
                <h2 className="font-bold underline"> Buy Quote Response </h2>
                <Card
                  className="flex-auto justify-top size-full p-5"
                  title="Buy Quote Response"
                >
                  {isQuoteLoading
                    ? "loading..."
                    : buyQuoteResponse && (
                        <ReactJson collapsed={true} src={buyQuoteResponse} />
                      )}
                </Card>
              </div>
            </section>
          </div>
        )}
      </Card>

      {/* Generate Secure Onramp Token + URL Card Box */}
      <div className="mt-5">
        <SecureTokenBox
          showBuyQuoteURLText
          aggregatorInputs={{
            quoteID: buyQuoteResponse?.quote_id || "",
            defaultAsset: buyQuoteParams.purchase_currency,
            defaultPaymentMethod: buyQuoteParams.payment_method,
            defaultNetwork: buyQuoteParams.purchase_network,
            fiatCurrency: buyQuoteParams.payment_currency,
            presentFiatAmount: buyQuoteParams.payment_amount,
          }}
          blockchains={purchase_networks_list.map((network) => network.name)}
        />
      </div>
    </div>
  );
}



