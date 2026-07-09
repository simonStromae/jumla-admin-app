import { prisma } from './prisma';

interface PushPayload {
  title: string;
  body:  string;
  url?:  string;
  tag?:  string;
}

export async function getVapidPublicKey(): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key: 'VAPID_PUBLIC_KEY' } }).catch(() => null);
  return row?.value ?? null;
}

async function getVapidKeys(): Promise<{ publicKey: string; privateKey: string } | null> {
  const [pub, priv] = await Promise.all([
    prisma.setting.findUnique({ where: { key: 'VAPID_PUBLIC_KEY' } }).catch(() => null),
    prisma.setting.findUnique({ where: { key: 'VAPID_PRIVATE_KEY' } }).catch(() => null),
  ]);
  if (!pub?.value || !priv?.value) return null;
  return { publicKey: pub.value, privateKey: priv.value };
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  const keys = await getVapidKeys();
  if (!keys) return;

  const subs = await prisma.$queryRawUnsafe<{ endpoint: string; p256dh: string; auth: string }[]>(
    `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE "userId" = $1`,
    userId,
  ).catch(() => [] as { endpoint: string; p256dh: string; auth: string }[]);

  if (!subs.length) return;

  const webpush = (await import('web-push')).default;
  webpush.setVapidDetails('mailto:info@jumlas.com', keys.publicKey, keys.privateKey);

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
      );
    } catch (e: any) {
      if (e?.statusCode === 410 || e?.statusCode === 404) {
        await prisma.$executeRawUnsafe(
          `DELETE FROM push_subscriptions WHERE endpoint = $1`,
          sub.endpoint,
        ).catch(() => {});
      }
    }
  }
}

export async function setupVapidKeys(): Promise<{ publicKey: string; privateKey: string }> {
  const existing = await getVapidKeys();
  if (existing) return existing;

  const webpush = (await import('web-push')).default;
  const { publicKey, privateKey } = webpush.generateVAPIDKeys();

  await Promise.all([
    prisma.setting.upsert({
      where:  { key: 'VAPID_PUBLIC_KEY' },
      create: { key: 'VAPID_PUBLIC_KEY',  value: publicKey  },
      update: { value: publicKey  },
    }),
    prisma.setting.upsert({
      where:  { key: 'VAPID_PRIVATE_KEY' },
      create: { key: 'VAPID_PRIVATE_KEY', value: privateKey },
      update: { value: privateKey },
    }),
  ]);

  return { publicKey, privateKey };
}
