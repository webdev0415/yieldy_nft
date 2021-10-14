const algosdk = require("algosdk");
const crypto = require("crypto");
const fs = require("fs");

const DISPENSERACCOUNT =
  "HZ57J3K46JIJXILONBBZOHX6BKPXEM2VVXNRFSUED6DKFD5ZD24PMJ3MVA";
async function createAsset(algodClient, sender, manager) {
  console.log("");
  console.log("==> CREATE ASSET");
  //Check account balance
  const accountInfo = await algodClient.accountInformation(sender.addr).do();
  const startingAmount = accountInfo.amount;
  console.log("Sender account balance: %d microAlgos", startingAmount);

  // Construct the transaction
  const params = await algodClient.getTransactionParams().do();
  // comment out the next two lines to use suggested fee
  params.fee = 1000;
  params.flatFee = true;

  const note = undefined; // arbitrary data to be stored in the transaction; here, none is stored

  // Whether user accounts will need to be unfrozen before transacting
  const defaultFrozen = false;

  // total number of this asset available for circulation
  // const totalIssuance = 1000;

  // Used to display asset units to user
  const unitName = "LATINUM";

  // Friendly name of the asset
  const assetName = "latinum";

  // Optional string pointing to a URL relating to the asset
  const url =
    "https://riotracersnft.s3.us-east-2.amazonaws.com/coming-soon.gif";

  // The following parameters are the only ones
  // that can be changed, and they have to be changed
  // by the current manager

  // If they are set to undefined at creation time, you will not be able to modify these later

  // Specified address can change reserve, freeze, clawback, and manager
  const managerAddr = manager.addr; // OPTIONAL: FOR DEMO ONLY, USED TO DESTROY ASSET WITHIN
  // Specified address is considered the asset reserve
  // (it has no special privileges, this is only informational)
  const reserveAddr = manager.addr;
  // Specified address can freeze or unfreeze user asset holdings
  const freezeAddr = manager.addr;
  // Specified address can revoke user asset holdings and send
  // them to other addresses
  const clawbackAddr = manager.addr;

  // Use actual total  > 1 to create a Fungible Token
  // example 1:(fungible Tokens)
  // totalIssuance = 10, decimals = 0, result is 10 total actual
  // example 2: (fractional NFT, each is 0.1)
  // totalIssuance = 10, decimals = 1, result is 1.0 total actual
  // example 3: (NFT)
  // totalIssuance = 1, decimals = 0, result is 1 total actual
  // integer number of decimals for asset unit calculation
  const decimals = 0;
  const total = 1; // how many of this asset there will be

  // Optional hash commitment of some sort relating to the asset. 32 character length.
  const assetMetadataHash = "16efaa3924a6fd9d3a4824799a4ac65d";

  // temp fix for replit
  //const metadata2 = "16efaa3924a6fd9d3a4824799a4ac65d";
  // const fullPath =  __dirname + '/NFT/metadata.json';
  //const metadatafile = (await fs.readFileSync(fullPath));
  // const metadatafile = (await fs.readFileSync(fullPath));
  // console.log('metadatafile', metadatafile)

  // signing and sending "txn" allows "addr" to create an asset
  const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    from: sender.addr,
    note,
    total,
    decimals,
    assetName,
    unitName,
    assetURL: url,
    assetMetadataHash,
    defaultFrozen,
    freeze: freezeAddr,
    manager: managerAddr,
    clawback: clawbackAddr,
    reserve: reserveAddr,
    suggestedParams: params,
  });

  const rawSignedTxn = txn.signTxn(sender.sk);
  const tx = await algodClient.sendRawTransaction(rawSignedTxn).do();
  let assetID = null;
  // wait for transaction to be confirmed
  const confirmedTxn = await waitForConfirmation(algodClient, tx.txId, 4);
  //Get the completed Transaction
  console.log(
    "Transaction " +
      tx.txId +
      " confirmed in round " +
      confirmedTxn["confirmed-round"]
  );
  const ptx = await algodClient.pendingTransactionInformation(tx.txId).do();
  assetID = ptx["asset-index"];
  // console.log("AssetID = " + assetID);

  await printCreatedAsset(algodClient, sender.addr, assetID);
  await printAssetHolding(algodClient, sender.addr, assetID);
  console.log(
    "You can verify the metadata-hash above in the asset creation details"
  );
  console.log(
    "Using terminal the Metadata hash should appear as identical to the output of"
  );
  console.log(
    "cat aliceAssetMetaData.json | openssl dgst -sha256 -binary | openssl base64 -A"
  );
  console.log("That is: Cii04FOHWE4NiXQ4s4J02we2gnJop5dOfdkBvUoGHQ8=");

  return { assetID };

  // Sample Output similar to
  // ==> CREATE ASSET
  // Alice account balance: 10000000 microAlgos
  // Transaction DM2QAJQ34AHOIH2XPOXB3KDDMFYBTSDM6CGO6SCM6A6VJYF5AUZQ confirmed in round 16833515
  // AssetID = 28291127
  // parms = {
  //   "clawback": "RA6RAUNDQGHRWTCR5YRL2YJMIXTHWD5S3ZYHVBGSNA76AVBAYELSNRVKEI",
  //   "creator": "RA6RAUNDQGHRWTCR5YRL2YJMIXTHWD5S3ZYHVBGSNA76AVBAYELSNRVKEI",
  //   "decimals": 0,
  //   "default-frozen": false,
  //   "freeze": "RA6RAUNDQGHRWTCR5YRL2YJMIXTHWD5S3ZYHVBGSNA76AVBAYELSNRVKEI",
  //   "manager": "RA6RAUNDQGHRWTCR5YRL2YJMIXTHWD5S3ZYHVBGSNA76AVBAYELSNRVKEI",
  //   "metadata-hash": "WQ4GxK4WqdklhWD9zJMfYH+Wgk+rTnqJIdW08Y7eD1U=",
  //   "name": "Alice's Artwork Coins",
  //   "name-b64": "QWxpY2UncyBBcnR3b3JrIENvaW5z",
  //   "reserve": "RA6RAUNDQGHRWTCR5YRL2YJMIXTHWD5S3ZYHVBGSNA76AVBAYELSNRVKEI",
  //   "total": 999,
  //   "unit-name": "ALICECOI",
  //   "unit-name-b64": "QUxJQ0VDT0k=",
  //   "url": "http://someurl",
  //   "url-b64": "aHR0cDovL3NvbWV1cmw="
  // }
  // assetholdinginfo = {
  //   "amount": 999,
  //   "asset-id": 28291127,
  //   "creator": "RA6RAUNDQGHRWTCR5YRL2YJMIXTHWD5S3ZYHVBGSNA76AVBAYELSNRVKEI",
  //   "is-frozen": false
  // }
}
async function modifyAsset(algodClient, sender, manager) {
  //These valuse should be come from params.
  const note = undefined;
  const assetID = 37491734;
  const reserve = undefined;
  const freeze = undefined;
  const clawback = undefined;
  params = await algodclient.getTransactionParams().do();
  //comment out the next two lines to use suggested fee
  params.fee = 1000;
  params.flatFee = true;

  // Note that the change has to come from the existing manager
  const c = algosdk.makeAssetConfigTxnWithSuggestedParams(
    recoveredAccount2.addr,
    note,
    assetID,
    manager.addr,
    reserve,
    freeze,
    clawback,
    params
  );

  const rawSignedTxn = ctxn.signTxn(manager.sk);
  const ctx = await algodclient.sendRawTransaction(rawSignedTxn).do();
  console.log("Transaction : " + ctx.txId);

  // wait for transaction to be confirmed
  await waitForConfirmation(algodclient, ctx.txId, 4);

  // Get the asset information for the newly changed asset
  // use indexer or utiltiy function for Account info
  // The manager should now be the same as the creator
  await printCreatedAsset(algodclient, sender.addr, assetID);
  // Transaction: BXDODE2RUC77WVJL6HOQBACVAS6QPXOBSE55ZZTLJUTNLBXZNENA
  // Transaction BXDODE2RUC77WVJL6HOQBACVAS6QPXOBSE55ZZTLJUTNLBXZNENA confirmed in round 3961855
  // AssetID = 2653785
  // parms = {
  //     "clawback": "AK6Q33PDO4RJZQPHEMODC6PUE5AR2UD4FBU6TNEJOU4UR4KC6XL5PWW5K4",
  //     "creator": "ATTR6RUEHHBHXKUHT4GUOYWNBVDV2GJ5FHUWCSFZLHD55EVKZWOWSM7ABQ",
  //     "decimals": 0,
  //     "default-frozen": false,
  //     "freeze": "AK6Q33PDO4RJZQPHEMODC6PUE5AR2UD4FBU6TNEJOU4UR4KC6XL5PWW5K4",
  //     "manager": "ATTR6RUEHHBHXKUHT4GUOYWNBVDV2GJ5FHUWCSFZLHD55EVKZWOWSM7ABQ",
  //     "metadata-hash": "MTZlZmFhMzkyNGE2ZmQ5ZDNhNDgyNDc5OWE0YWM2NWQ=",
  //     "name": "latinum",
  //     "reserve": "AK6Q33PDO4RJZQPHEMODC6PUE5AR2UD4FBU6TNEJOU4UR4KC6XL5PWW5K4",
  //     "total": 1000,
  //     "unit-name": "LATINUM",
  //     "url": "http://someurl"
  // }

  return { assetID };
}
async function receiveAsset(algodClient, receiver, assetID) {
  params = await algodClient.getTransactionParams().do();
  //comment out the next two lines to use suggested fee
  params.fee = 1000;
  params.flatFee = true;
  // Opting in to transact with the new asset
  // Allow accounts that want recieve the new asset
  // Have to opt in. To do this they send an asset transfer
  // of the new asset to themseleves
  // In this example we are setting up the 3rd recovered account to
  // receive the new asset
  let sender = receiver.addr;
  let recipient = sender;
  // We set revocationTarget to undefined as
  // This is not a clawback operation
  let revocationTarget = undefined;
  // CloseReaminerTo is set to undefined as
  // we are not closing out an asset
  let closeRemainderTo = undefined;
  const note = undefined;
  // We are sending 0 assets
  amount = 0;
  // signing and sending "txn" allows sender to begin accepting asset specified by creator and index
  let opttxn = algosdk.makeAssetTransferTxnWithSuggestedParams(
    sender,
    recipient,
    closeRemainderTo,
    revocationTarget,
    amount,
    note,
    assetID,
    params
  );
  // Must be signed by the account wishing to opt in to the asset
  rawSignedTxn = opttxn.signTxn(receiver.sk);
  let opttx = await algodClient.sendRawTransaction(rawSignedTxn).do();
  console.log("Transaction : " + opttx.txId);
  // wait for transaction to be confirmed
  await waitForConfirmation(algodClient, opttx.txId, 4);
  //You should now see the new asset listed in the account information
  console.log("Account 3 = " + receiver.addr);
  await printAssetHolding(algodClient, receiver.addr, assetID);
}
async function transferAsset(algodClient, sender, receiver, assetID) {
  // Transfer New Asset:
  // Now that account3 can recieve the new tokens
  // we can tranfer tokens in from the creator
  // to account3
  sender_addr = sender.addr;
  recipient = receiver.addr;
  revocationTarget = undefined;
  closeRemainderTo = undefined;
  note = undefined;
  //Amount of the asset to transfer
  amount = 1;
  params = await algodClient.getTransactionParams().do();
  params.fee = 1000;
  params.flatFee = true;
  // signing and sending "txn" will send "amount" assets from "sender" to "recipient"
  let xtxn = algosdk.makeAssetTransferTxnWithSuggestedParams(
    sender_addr,
    recipient,
    closeRemainderTo,
    revocationTarget,
    amount,
    note,
    assetID,
    params
  );
  // Must be signed by the account sending the asset
  rawSignedTxn = xtxn.signTxn(sender.sk);
  let xtx = await algodClient.sendRawTransaction(rawSignedTxn).do();
  console.log("Transaction : " + xtx.txId);
  // wait for transaction to be confirmed
  await waitForConfirmation(algodClient, xtx.txId, 4);

  // You should now see the 10 assets listed in the account information
  await printAssetHolding(algodClient, receiver.addr, assetID);
}

async function destroyAsset(algodClient, sender, assetID) {
  console.log("");
  console.log("==> DESTROY ASSET");
  // All of the created assets should now be back in the creators
  // Account so we can delete the asset.
  // If this is not the case the asset deletion will fail
  const params = await algodClient.getTransactionParams().do();
  // Comment out the next two lines to use suggested fee
  // params.fee = 1000;
  // params.flatFee = true;
  // The address for the from field must be the manager account
  const addr = sender.addr;
  // if all assets are held by the asset creator,
  // the asset creator can sign and issue "txn" to remove the asset from the ledger.
  const txn = algosdk.makeAssetDestroyTxnWithSuggestedParamsFromObject({
    from: addr,
    note: undefined,
    assetIndex: assetID,
    suggestedParams: params,
  });
  // The transaction must be signed by the manager which
  // is currently set to alice
  const rawSignedTxn = txn.signTxn(sender.sk);
  const tx = await algodClient.sendRawTransaction(rawSignedTxn).do();
  // Wait for confirmation
  const confirmedTxn = await waitForConfirmation(algodClient, tx.txId, 4);
  //Get the completed Transaction
  console.log(
    "Transaction " +
      tx.txId +
      " confirmed in round " +
      confirmedTxn["confirmed-round"]
  );
  // The account3 and account1 should no longer contain the asset as it has been destroyed
  console.log("Asset ID: " + assetID);
  console.log("Alice = " + sender.addr);
  await printCreatedAsset(algodClient, sender.addr, assetID);
  await printAssetHolding(algodClient, sender.addr, assetID);

  return;
  // Notice that although the asset was destroyed, the asset id and associated
  // metadata still exists in account holdings for any account that optin.
  // When you destroy an asset, the global parameters associated with that asset
  // (manager addresses, name, etc.) are deleted from the creator's account.
  // However, holdings are not deleted automatically -- users still need to
  // use the closeToAccount on the call makePaymentTxnWithSuggestedParams of the deleted asset.
  // This is necessary for technical reasons because we currently can't have a single transaction touch potentially
  // thousands of accounts (all the holdings that would need to be deleted).

  // ==> DESTROY ASSET
  // Transaction QCE52AAX75VBSGDL36VHMNVT6LXSR5M6V5JUNSKE6BXQGLQEMLDA confirmed in round 16833536
  // Asset ID: 28291127
  // Alice = RA6RAUNDQGHRWTCR5YRL2YJMIXTHWD5S3ZYHVBGSNA76AVBAYELSNRVKEI
  // Bob = YC3UYV4JLHD344OC3G7JK37DRVSE7X7U2NOZVWSQNVKNEGV4M3KFA7WZ44
}
async function closeoutAliceAlgos(algodClient, alice) {
  console.log("");
  console.log("==> CLOSE OUT ALICE'S ALGOS TO DISPENSER");
  let accountInfo = await algodClient.accountInformation(sender.addr).do();
  console.log("Alice Account balance: %d microAlgos", accountInfo.amount);
  const startingAmount = accountInfo.amount;
  // Construct the transaction
  const params = await algodClient.getTransactionParams().do();
  // comment out the next two lines to use suggested fee
  // params.fee = 1000;
  // params.flatFee = true;
  // For more info see:
  // https://developer.algorand.org/docs/reference/transactions/#payment-transaction
  // receiver account to send to
  const receiver = sender.addr;
  const enc = new TextEncoder();
  const amount = 0;
  const sender = sender.addr;
  // closeToRemainder will remove the assetholding from the account
  const closeRemainderTo = DISPENSERACCOUNT;
  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: sender,
    to: receiver,
    amount,
    closeRemainderTo,
    note: undefined,
    suggestedParams: params,
  });
  // Sign the transaction
  const rawSignedTxn = txn.signTxn(sender.sk);
  // Submit the transaction
  const tx = await algodClient.sendRawTransaction(rawSignedTxn).do();
  // Wait for confirmation
  const confirmedTxn = await waitForConfirmation(algodClient, tx.txId, 4);
  //Get the completed Transaction
  console.log(
    "Transaction " +
      tx.txId +
      " confirmed in round " +
      confirmedTxn["confirmed-round"]
  );
  // const mytxinfo = JSON.stringify(confirmedTxn.txn.txn, undefined, 2);
  // console.log("Transaction information: %o", mytxinfo);
  accountInfo = await algodClient.accountInformation(sender.addr).do();
  let txAmount = confirmedTxn.txn.txn.amt;
  if (confirmedTxn.txn.txn.amt == undefined) {
    console.log("Transaction Amount: %d microAlgos", 0);
    txAmount = 0;
  } else {
    console.log("Transaction Amount: %d microAlgos", confirmedTxn.txn.txn.amt);
  }
  console.log("Transaction Fee: %d microAlgos", confirmedTxn.txn.txn.fee);
  const closeoutamt = startingAmount - txAmount - confirmedTxn.txn.txn.fee;
  console.log("Close To Amount: %d microAlgos", closeoutamt);
  console.log("Bobs Account balance: %d microAlgos", accountInfo.amount);
  return;
  // Sample Output
  // ==> CLOSE OUT ALICE'S ALGOS TO DISPENSER
  // Alice Account balance: 8996000 microAlgos
  // Transaction IC6IQVUOFLTTXNWZWD4F6L5CZXOFBTD3EY2QJUY5MHUOQSAX3CEA confirmed in round 16833543
  // Transaction Amount: 0 microAlgos
  // Transaction Fee: 1000 microAlgos
  // Bobs Account balance: 0 microAlgos
}

/**
 * Wait until the transaction is confirmed or rejected, or until 'timeout'
 * number of rounds have passed.
 * @param {algosdk.Algodv2} algodClient the Algod V2 client
 * @param {string} txId the transaction ID to wait for
 * @param {number} timeout maximum number of rounds to wait
 * @return {Promise<*>} pending transaction information
 * @throws Throws an error if the transaction is not confirmed or rejected in the next timeout rounds
 */
const waitForConfirmation = async function (algodClient, txId, timeout) {
  if (algodClient == null || txId == null || timeout < 0) {
    throw new Error("Bad arguments");
  }

  const status = await algodClient.status().do();
  if (status === undefined) {
    throw new Error("Unable to get node status");
  }

  const startround = status["last-round"] + 1;
  let currentround = startround;

  while (currentround < startround + timeout) {
    const pendingInfo = await algodClient
      .pendingTransactionInformation(txId)
      .do();
    if (pendingInfo !== undefined) {
      if (
        pendingInfo["confirmed-round"] !== null &&
        pendingInfo["confirmed-round"] > 0
      ) {
        //Got the completed Transaction
        return pendingInfo;
      } else {
        if (
          pendingInfo["pool-error"] != null &&
          pendingInfo["pool-error"].length > 0
        ) {
          // If there was a pool error, then the transaction has been rejected!
          throw new Error(
            "Transaction " +
              txId +
              " rejected - pool error: " +
              pendingInfo["pool-error"]
          );
        }
      }
    }
    await algodClient.statusAfterBlock(currentround).do();
    currentround++;
  }
  throw new Error(
    "Transaction " + txId + " not confirmed after " + timeout + " rounds!"
  );
};
// Function used to print created asset for account and assetid
const printCreatedAsset = async function (algodClient, account, assetid) {
  // note: if you have an indexer instance available it is easier to just use this
  //     let accountInfo = await indexerClient.searchAccounts()
  //    .assetID(assetIndex).do();
  // and in the loop below use this to extract the asset for a particular account
  // accountInfo['accounts'][idx][account]);
  let accountInfo = await algodClient.accountInformation(account).do();
  for (idx = 0; idx < accountInfo["created-assets"].length; idx++) {
    let scrutinizedAsset = accountInfo["created-assets"][idx];
    if (scrutinizedAsset["index"] == assetid) {
      console.log("AssetID = " + scrutinizedAsset["index"]);
      let myparms = JSON.stringify(scrutinizedAsset["params"], undefined, 2);
      console.log("parms = " + myparms);
      break;
    }
  }
};
// Function used to print asset holding for account and assetid
const printAssetHolding = async function (algodClient, account, assetid) {
  // note: if you have an indexer instance available it is easier to just use this
  //     let accountInfo = await indexerClient.searchAccounts()
  //    .assetID(assetIndex).do();
  // and in the loop below use this to extract the asset for a particular account
  // accountInfo['accounts'][idx][account]);
  let accountInfo = await algodClient.accountInformation(account).do();
  for (idx = 0; idx < accountInfo["assets"].length; idx++) {
    let scrutinizedAsset = accountInfo["assets"][idx];
    if (scrutinizedAsset["asset-id"] == assetid) {
      let myassetholding = JSON.stringify(scrutinizedAsset, undefined, 2);
      console.log("assetholdinginfo = " + myassetholding);
      break;
    }
  }
};
// Function used to print all asset holding for account
const printAllAssetHolding = async function (algodClient, account) {
  let accountInfo = await algodClient.accountInformation(account).do();
  console.log("account", account, accountInfo.assets)
}
async function main() {
  try {
    const senderMnemonic =
      "scene position marble verb lemon decrease novel mammal either shuffle avoid load census mixed weather wonder erupt rapid success gloom hockey forest addict able crouch";
    const sender = algosdk.mnemonicToSecretKey(senderMnemonic); // DO7SE4GESRI5EN23LL7TTQ6ZGHUBBSEMPGZNGIESSFDBXG6PT2U672KAEA

    const managerMnemonic =
      "attack visa object sponsor shuffle razor bacon holiday leave illness candy clown extra sing hawk celery firm void logic hair throw cover symbol ability coconut";
    const manager = algosdk.mnemonicToSecretKey(managerMnemonic); // M2Z4TX2QBDDHLFUAJ6I4BVTXES45DMBF6VPVQKOIAC4P3F323SILOWDJW4

    const receiverMnemonic =
      "amazing object main salute globe equip lake imitate stand push stage angry wide mercy treat display scatter imitate silent left bleak mountain used absorb quote";
    const receiver = algosdk.mnemonicToSecretKey(receiverMnemonic); // T544Z3JDFZRFALB5FHOIQDWRUG6V5JT7OZWRRGR4OJ4BUFZZT2FQN7BXJM

    const algodToken =
      "2f3203f21e738a1de6110eba6984f9d03e5a95d7a577b34616854064cf2c0e7b";
    const algodServer = "https://academy-algod.dev.aws.algodev.network";
    const algodPort = 443;

    let algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);
    await printAllAssetHolding(algodClient, sender.addr);
    await printAllAssetHolding(algodClient, manager.addr);
    await printAllAssetHolding(algodClient, receiver.addr);

    const assetID = 36793844;
    // await receiveAsset(algodClient, sender, assetID)
    await transferAsset(algodClient, receiver, sender, assetID)
    
    // CREATE ASSET
    // const { assetID } = await createAsset(algodClient, sender, manager);
    // DESTROY ASSET
    // await destroyAsset(algodClient, sender, assetID);
    // CLOSEOUT ALGOS - Alice closes out Alogs to dispenser
    // await closeoutAliceAlgos(algodClient, sender);
  } catch (err) {
    console.log("err", err);
  }
  process.exit();
}

main();
