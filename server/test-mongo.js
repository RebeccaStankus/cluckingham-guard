const path = require("path");
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");

// Load server/.env explicitly
dotenv.config({ path: path.join(__dirname, ".env") });

// Debug: show whether we loaded the var
if (!process.env.MONGO_URI) {
     console.error("❌ MONGO_URI is missing. Make sure server/.env exists and has MONGO_URI=...");
     process.exit(1);
}

const uri = process.env.MONGO_URI;

async function main() {
     const client = new MongoClient(uri);
     try {
          await client.connect();
          console.log("✅ Connected to Mongo!");
          const db = client.db("cluckingham"); // database name from your URI
          console.log("DB:", db.databaseName);
     } catch (err) {
          console.error("❌ Connection error:", err);
     } finally {
          await client.close();
     }
}

main();
