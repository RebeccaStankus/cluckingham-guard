// client/src/routes/api/chickens/+server.ts
import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";
import { chickens, type ChickenDoc } from "$lib/server/db";
import type { Chicken } from "$lib/types/chicken";

export const GET: RequestHandler = async () => {
     const col = await chickens();
     const list = (await col.find({}).toArray())
          .map(({ _id, ...rest }) => ({ ...rest, _id: _id!.toString() }));
     return json(list);
};


export const POST: RequestHandler = async ({ request }) => {
     const body = (await request.json()) as Partial<Chicken>;
     if (!body?.name || !body?.breed) {
          return json({ error: "name and breed are required" }, { status: 400 });
     }
     const doc: ChickenDoc = {
          name: body.name.trim(),
          breed: body.breed,
          dateOfHatch: body.dateOfHatch || undefined,
          description: body.description,
          eggSongUrl: body.eggSongUrl || undefined,
          imageUrl: body.imageUrl || undefined,
          status: body.status ?? "active",
          lastSeenAt: body.lastSeenAt ?? Date.now()
     };

     const col = await chickens();
     await col.insertOne(doc);
     return json({ ok: true });
};
