const algosdk = require("algosdk");

const indexer_server = "https://testnet.algoexplorerapi.io/idx2/";
const indexer_port = "";
const indexer_token = "";

// Instantiate the indexer client wrapper
let indexerClient = new algosdk.Indexer(
  indexer_token,
  indexer_server,
  indexer_port
);

export async function searchAssetName({ name, creator }) {
  console.log("");
  console.log("==> SEARCH ASSETS FOR NAME AND CREATOR");
  const name = "Alice's Artwork";
  const creator = "BHF5U3LAR5Z7R272Q4VK6JLWFSYWKBS7PLA44FFBK2YW2WZLQM7FXOJXQM";
  const assetInfo = await indexerClient
    .searchForAssets()
    .name(name)
    .creator(creator)
    .do();
  console.log(
    "Creator Information for Asset Name: " +
      JSON.stringify(assetInfo, undefined, 2)
  );
  return JSON.stringify(assetInfo, undefined, 2);
}

export async function assetBalances({ assetIndex }) {
  console.log("");
  console.log("==> LOOKUP ASSET BALANCES");
  let assetIndex = 29340683;
  let assetInfo = await indexerClient.lookupAssetBalances(assetIndex).do();
  console.log(
    "Information for Asset: " + JSON.stringify(assetInfo, undefined, 2)
  );
  return JSON.stringify(assetInfo, undefined, 2);
}

export async function searchTxAddressAsset({ address, asset_id, min_amount }) {
  console.log("");
  console.log("==> SEARCH TRANSACTIONS FOR ASSET AND MIN AMOUNT");
  //   const address = "BHF5U3LAR5Z7R272Q4VK6JLWFSYWKBS7PLA44FFBK2YW2WZLQM7FXOJXQM";
  //   const asset_id = 29340683;
  // asset min amount
  //   const min_amount = 99;

  const response = await indexerClient
    .searchForTransactions()
    .assetID(asset_id)
    .address(address)
    .currencyGreaterThan(min_amount)
    .do();
  console.log(
    "Information for Transaction search: " +
      JSON.stringify(response, undefined, 2)
  );
  return JSON.stringify(response, undefined, 2);
}

export async function searchAssets({ assetIndex }) {
  console.log("");
  console.log("==> SEARCH ACCOUNTS FOR ASSET");
  // const assetIndex = 29340683;
  const accountInfo = await indexerClient
    .searchAccounts()
    .assetID(assetIndex)
    .do();
  console.log(
    "Account Information for Asset: " +
      JSON.stringify(accountInfo, undefined, 2)
  );
  return JSON.stringify(accountInfo, undefined, 2);
}
