const express = require("express");
const cors = require("cors");
const bs58 = require("bs58").default;
const { Keypair, VersionedTransaction } = require("@solana/web3.js");

const app = express();
app.use(cors());
app.use(express.json());

const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY fehlt!");
}

const keypair = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));

app.post("/sign", async (req, res) => {
  try {
    const swapTransaction = req.body.swapTransaction;

    if (!swapTransaction) {
      return res.status(400).send("swapTransaction missing");
    }

    const txBuf = Buffer.from(swapTransaction, "base64");
    const transaction = VersionedTransaction.deserialize(txBuf);

    transaction.sign([keypair]);

    const signedTx = Buffer.from(transaction.serialize()).toString("base64");

    res.json({ signedTransaction: signedTx });

  } catch (err) {
    console.error(err);
    res.status(500).send("Signing error");
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Signer running on port " + PORT);
});
