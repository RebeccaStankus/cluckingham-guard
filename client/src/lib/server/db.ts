// client/src/lib/server/db.ts
import { MongoClient } from "mongodb";
import type { ObjectId, Db, Collection } from "mongodb";
import { env } from "$env/dynamic/private";
import type { Chicken } from "$lib/types/chicken";

export type ChickenDoc = Omit<Chicken, "_id"> & { _id?: ObjectId };

let client: MongoClient | null = null;
let db: Db | null = null;
let connecting: Promise<MongoClient> | null = null;

async function getDb(): Promise<Db> {
     if (db) return db;
     const uri = env.MONGO_URI;
     if (!uri) throw new Error("MONGO_URI is not set");
     if (!connecting) {
          client = new MongoClient(uri);
          connecting = client.connect();
     }
     await connecting;
     db = client!.db("cluckingham");
     return db;
}

export async function chickens(): Promise<Collection<ChickenDoc>> {
     const database = await getDb();
     return database.collection<ChickenDoc>("chickens");
}