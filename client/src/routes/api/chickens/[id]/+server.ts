import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { chickens } from '$lib/server/db';
import { ObjectId } from 'mongodb';
import type { Chicken } from '$lib/types/chicken';

export const PUT: RequestHandler = async ({ params, request }) => {
     const { id } = params;                   // <-- available because this is in [id]/+server.ts
     if (!ObjectId.isValid(id)) return json({ error: 'Invalid id' }, { status: 400 });

     const body = (await request.json()) as Partial<Chicken>;
     const { _id, ...rest } = body;

     const allowed: (keyof Omit<Chicken, '_id'>)[] =
          ['name', 'breed', 'dateOfHatch', 'description', 'eggSongUrl', 'imageUrl', 'status', 'lastSeenAt'];

     const $set: Record<string, unknown> = {};
     for (const k of allowed) if (rest[k] !== undefined) $set[k] = rest[k];
     if (Object.keys($set).length === 0) return json({ error: 'No fields to update' }, { status: 400 });

     const col = await chickens();
     const updated = await col.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set },
          { returnDocument: 'after' }
     );

     if (!updated) return json({ error: 'Not found' }, { status: 404 });
     return json({ ...updated, _id: updated._id.toString() });
};
