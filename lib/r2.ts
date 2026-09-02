import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.R2_ACCOUNT_ID!;
const bucketName = process.env.R2_BUCKET_NAME!;

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

/** URL présignée à durée courte pour que le navigateur envoie le fichier directement à R2. */
export async function createUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({ Bucket: bucketName, Key: key, ContentType: contentType });
  return getSignedUrl(r2Client, command, { expiresIn: 60 * 10 });
}

/** URL présignée pour la lecture (bucket privé, comme les Signed URLs Supabase Storage précédemment). */
export async function createPlaybackUrl(key: string) {
  const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
  return getSignedUrl(r2Client, command, { expiresIn: 60 * 60 });
}

export async function deleteObject(key: string) {
  const command = new DeleteObjectCommand({ Bucket: bucketName, Key: key });
  await r2Client.send(command);
}
