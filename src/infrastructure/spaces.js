// infrastructure/storage/spaces.js
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";


function getKeyFromFile(file) {
  if (file.url) {
    try {
      const url = new URL(file.url);
      return decodeURIComponent(url.pathname.replace(/^\/+/, ""));
    } catch (e) {
      console.warn("URL parse failed, fallback to spacesKey");
    }
  }

  return file.spacesKey;
}

const spacesClient = new S3Client({
  region: process.env.DO_SPACES_REGION || "sfo3",
  endpoint: process.env.DO_SPACES_ENDPOINT,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
  },
});

export async function createSignedInspectorFileUrl(file) {
  const key = getKeyFromFile(file);

  // console.log("SIGNED FILE KEY:", key); 

  const command = new GetObjectCommand({
    Bucket: process.env.DO_SPACES_BUCKET || "inspector-files",
    Key: key,
    ResponseContentDisposition: `inline; filename="${encodeURIComponent(file.name)}"`,
    ResponseContentType: file.mimeType || "application/octet-stream",
  });

  return getSignedUrl(spacesClient, command, {
    expiresIn: 60 * 10,
  });
}