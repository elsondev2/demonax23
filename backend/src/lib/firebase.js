import admin from "firebase-admin";
import { ENV } from "./env.js";
import { randomUUID } from "crypto";

const projectId = ENV.FIREBASE_PROJECT_ID;
const clientEmail = ENV.FIREBASE_CLIENT_EMAIL;
const privateKeyRaw = ENV.FIREBASE_PRIVATE_KEY;
const privateKey = privateKeyRaw?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.warn(
    "Firebase admin credentials are not fully set. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY."
  );
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    storageBucket: ENV.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
  });
}

export const bucket = admin.storage().bucket();

/**
 * Upload a base64 data URL to Firebase Storage.
 * @param {Object} params
 * @param {string} params.base64 Base64 data URL string (e.g. "data:image/png;base64,....")
 * @param {string} [params.folder="uploads"] Destination folder path inside the bucket
 * @returns {{ key: string, url: string, contentType: string }}
 */
export async function uploadBase64ImageToFirebase({ base64, folder = "uploads" }) {
  if (!base64 || typeof base64 !== "string" || !base64.includes(",")) {
    throw new Error("Invalid base64 image input");
  }
  const [meta, data] = base64.split(",");
  const contentTypeMatch = /data:(.*?);base64/.exec(meta);
  const contentType = contentTypeMatch?.[1] || "application/octet-stream";
  const extension = contentType.split("/")[1] || "bin";

  const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const buffer = Buffer.from(data, "base64");

  const file = bucket.file(key);
  const token = randomUUID();
  const metadata = {
    contentType,
    metadata: {
      firebaseStorageDownloadTokens: token,
    },
  };

  await file.save(buffer, {
    metadata,
    resumable: false,
    public: false,
    validation: "md5",
  });

  const bucketName = bucket.name; // e.g., <project-id>.appspot.com
  const url = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(key)}?alt=media&token=${token}`;

  return { key, url, contentType };
}

export default { uploadBase64ImageToFirebase, bucket };
