const express = require("express");
const cors = require("cors");
const bs58Module = require("bs58");
const { Keypair, VersionedTransaction } = require("@solana/web3.js");

// bs58 Fix (für alle Node-Versionen)
const bs58 = bs58Module.decode ? bs58Module : bs58Module.default;

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ENV Variablen
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const API_KEY = process.env.API_KEY;

if (!PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY fehlt!");
}

// Wallet laden
const secretKey = bs58.decode(PRIVATE_KEY);
const keypair = Keypair.fromSecretKey(secretKey);

// SIGN ENDPOINT
app.post("/sign", async (req, res) => {
  try {
    // API-Key prüfen
    if (req.headers["x-api-key"] !== API_KEY) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { swapTransaction } = req.body;

    if (!swapTransaction) {
      return res.status(400).json({ error: "Missing swapTransaction" });
    }

    // Transaction dekodieren
    const tx = VersionedTransaction.deserialize(
      Buffer.from(swapTransaction, "base64")
    );

    // Sicherheitscheck: Wallet muss enthalten sein
    const isSignerIncluded = tx.message.staticAccountKeys.some(
      (key) => key.toBase58() === keypair.publicKey.toBase58()
    );

    if (!isSignerIncluded) {
      return res.status(400).json({ error: "Wallet not in transaction" });
    }

    // Transaktion signieren
    tx.sign([keypair]);

    // zurückgeben
    const signedTx = Buffer.from(tx.serialize()).toString("base64");

    res.json({ signedTransaction: signedTx });

  } catch (err) {
    console.error("SIGN ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// SERVER START
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Signer läuft auf Port ${PORT}`);
});
