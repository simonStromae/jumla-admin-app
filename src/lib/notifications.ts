import { prisma } from './prisma';

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  parcelId?: string | null,
) {
  const id = crypto.randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO notifications (id, "userId", type, title, body, "parcelId") VALUES ($1, $2, $3, $4, $5, $6)`,
    id, userId, type, title, body, parcelId ?? null,
  );
}
