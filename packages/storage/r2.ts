// Stockage des documents sur Cloudflare R2 (compatible S3). Bucket privé : accès uniquement par URL signée.
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createHash } from 'crypto';

function config() {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error('Variables R2 manquantes (R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET).');
  }
  return { endpoint, accessKeyId, secretAccessKey, bucket };
}

let client: S3Client | null = null;
function s3(): S3Client {
  if (!client) {
    const c = config();
    client = new S3Client({ region: 'auto', endpoint: c.endpoint,
      credentials: { accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey } });
  }
  return client;
}

export interface DocumentEnvoye { key: string; sizeBytes: number; sha256: string }

export async function envoyerDocument(key: string, body: Buffer, contentType: string): Promise<DocumentEnvoye> {
  if (!key || key.startsWith('/') || key.includes('..')) throw new Error(`Clé de stockage invalide : ${key}`);
  const sha256 = createHash('sha256').update(body).digest('hex');
  await s3().send(new PutObjectCommand({ Bucket: config().bucket, Key: key, Body: body,
    ContentType: contentType, Metadata: { sha256 } }));
  return { key, sizeBytes: body.length, sha256 };
}

export async function urlTelechargement(key: string, nomFichier: string, ttlSecondes = 300): Promise<string> {
  const safeName = nomFichier.replace(/[^\w.\-]/g, '_');
  return getSignedUrl(s3(), new GetObjectCommand({ Bucket: config().bucket, Key: key,
    ResponseContentDisposition: `attachment; filename="${safeName}"` }), { expiresIn: ttlSecondes });
}

export async function existeDocument(key: string): Promise<boolean> {
  try { await s3().send(new HeadObjectCommand({ Bucket: config().bucket, Key: key })); return true; }
  catch { return false; }
}
