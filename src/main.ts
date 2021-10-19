import { AssetService } from './asset.service';
const express = require('express');
const app = express();
const fs = require('fs');
const data = require('../src/db.json');
const bodyParser = require('body-parser');
const cors = require('cors');

const corsOptions = {
  origin: 'https://algorand-client.herokuapp.com',
  optionsSuccessStatus: 200,
};
app.options('*', cors());

const assetService = new AssetService();
app.use(bodyParser.json());
const prefix = '/api';
const port = process.env.PORT || 3000;

app.get(prefix, cors(corsOptions), (req, res) => {
  // Only send the address to frontend
  const addresses = data.map((account) => {
    return { address: account.address };
  });
  res.send(addresses);
});

app.get(prefix + '/asset/account/:id', cors(corsOptions), async (req, res) => {
  const address = req.params.id;
  let asset = '';

  if (address) {
    asset = await assetService.lookupAssetsById(req.params.id);
  }

  res.send(asset);
});

// Create a new alogrand account
app.post(prefix + '/asset/account', cors(corsOptions), async (req, res) => {
  const account = await assetService.generateAlgorandAccount();

  if (account) {
    data.push(account);

    fs.writeFile(__dirname + '/db.json', JSON.stringify(data), (err) => {
      if (err) Promise.reject(err);
    });
  }

  res.send(data);
});

// Transfer an algorand asset
app.post(prefix + '/asset/transfer', cors(corsOptions), async (req, res) => {
  let asset;
  const { body } = req;

  const senderAccount = data.find((account) => {
    return account.address === body.senderAddress;
  });

  const recipientAccount = data.find((account) => {
    return account.address === body.recipientAddress;
  });

  if (senderAccount && recipientAccount) {
    const transferData = {
      senderAccount,
      recipientAccount,
      assetId: body.assetId,
      amount: body.amount,
    };
    asset = await assetService.createAssetTransferWithAssetInfo(transferData);
  }

  res.send(asset);
});

// Create an algorand asset
app.post(prefix + '/asset', cors(corsOptions), async (req, res) => {
  console.log("req body", req.body)
  let asset;
  const { body } = req;

  const account = data.find((account) => {
    return account.address === body.address;
  });

  if (account) {
    asset = await assetService.createNewAlgoAsset(body, account);
  }

  res.send(asset);
});
// Buy an algorand asset
app.post(prefix + '/asset/buy', cors(corsOptions), async (req, res) => {

  const { assetId, amount, buyer, seller, sell_price } = req.body
  const sellPrice = sell_price
  const senderAccount = data.find((account) => {
    return account.address === buyer;
  });

  const recipientAccount = data.find((account) => {
    return account.address === seller;
  });
  const resp = await assetService.buyAsset(assetId, amount, senderAccount, recipientAccount, sellPrice);

  res.send(resp);
});

app.listen(port, () => {
  console.log(`App listening at ${port}`);
});
