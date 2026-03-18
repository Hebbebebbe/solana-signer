import express from "express";
import cors from "cors";
import bs58 from "bs58";
import {
  Keypair,
  VersionedTransaction
} from "@solana/web3.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ENV
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const API_KEY = process.env.API_KEY;

if (!PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY fehlt!");
}

// Wallet laden
const secretKey = bs58.decode(PRIVATE_KEY);
const keypair = Keypair.fromSecretKey(secretKey);

// 🔒 SIGN ENDPOINT
app.post("/sign", async (req, res) => {
  try {
    // 🔐 API KEY CHECK
    if (req.headers["x-api-key"] !== API_KEY) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { swapTransaction } = req.body;

    if (!swapTransaction) {
      return res.status(400).json({ error: "Missing swapTransaction" });
    }

    // Decode Transaction
    const tx = VersionedTransaction.deserialize(
      Buffer.from(swapTransaction, "base64")
    );

    // 🔒 OPTIONAL: Check ob deine Wallet beteiligt ist
    const isSignerIncluded = tx.message.staticAccountKeys.some(
      (key) => key.toBase58() === keypair.publicKey.toBase58()
    );

    if (!isSignerIncluded) {
      return res.status(403).json({
        error: "Transaction enthält nicht deine Wallet!"
      });
    }

    // Signieren
    tx.sign([keypair]);

    const signedTx = Buffer.from(tx.serialize()).toString("base64");

    return res.json({
      signedTransaction: signedTx
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Signer Fehler" });
  }
});

// HEALTHCHECK
app.get("/", (req, res) => {
  res.send("Signer läuft 🚀");
});

// PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Signer läuft auf Port " + PORT);
});
