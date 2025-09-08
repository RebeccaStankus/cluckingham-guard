// client/src/lib/types/chicken.ts
import type { ObjectId } from 'mongodb';

export type Chicken = {
     name: string;
     dateOfHatch?: string;
     breed?: "Rhode Island Red" | "Light Brahma" | "Black Australorp" | "Barred Plymouth Rock";
     description?: string;
     eggSongUrl?: string;
     imageUrl?: string;
     status?: "active" | "missing" | "rehomed";
     lastSeenAt?: number;
     _id?: string;
};

// server-side Mongo shape:
export type ChickenDoc = Omit<Chicken, '_id'> & { _id: ObjectId };