const express = require("express");
const cors = require("cors");
const bs58 = require("bs58").default;
const { Keypair, VersionedTransaction } = require("@solana/web3.js");

const app = express();
app.use(cors());
app.use(express.json());

// ⚠️ HIER DEIN PRIVATE KEY (Base58)
const PRIVATE_KEY = "41cmxbwztMWSacrm17JdcmadfSVCSqaD2Ts3LUSfPfss4Cu6suZU2KJbxrZEq9oHNBUYHAsNe8NWXr4dmwPuo3NC";

const keypair = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));

app.post("/sign", async (req, res) => {
  try {

    const swapTransaction = req.body.swapTransaction;

    const txBuf = Buffer.from(swapTransaction, "base64");

    const transaction = VersionedTransaction.deserialize(txBuf);

    transaction.sign([keypair]);

    const signedTx = Buffer.from(transaction.serialize()).toString("base64");

    res.json({
      signedTransaction: signedTx
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Signing error");
  }
});

app.listen(3000, () => {
  console.log("Signer running on port 3000");
});