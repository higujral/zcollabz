import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
const region = process.env.S3_REGION;
export const bucketName = process.env.S3_BUCKET;
const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL; // optional: use for public objects

if (!accessKeyId || !secretAccessKey || !region || !bucketName) {
    throw new Error('S3 configuration is missing. Please set S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_REGION, and S3_BUCKET.');
}

export const s3 = new S3Client({
    region,
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
});

export async function uploadPdf(key: string, body: Buffer) {
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: body,
        ContentType: 'application/pdf',
    });

    await s3.send(command);
}

export async function getPdfUrl(key: string, expiresInSeconds = 60 * 60 * 24 * 7) {
    if (publicBaseUrl) {
        // Use public base URL if the bucket or CDN is configured for public reads
        return `${publicBaseUrl.replace(/\/$/, '')}/${key}`;
    }

    const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
    });

    return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}
