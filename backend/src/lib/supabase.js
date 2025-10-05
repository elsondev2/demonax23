import { createClient } from "@supabase/supabase-js";
import { ENV } from "./env.js";
import sharp from "sharp";

if (!ENV.SUPABASE_URL || !ENV.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("Supabase URL or SERVICE_ROLE_KEY not set. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");
}

export const supabaseAdmin = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const DEFAULT_BUCKET = ENV.SUPABASE_BUCKET || "uploads";

async function ensureBucketExists(bucket = DEFAULT_BUCKET) {
  // List buckets and create if missing (idempotent)
  const { data: buckets, error: listErr } = await supabaseAdmin.storage.listBuckets();
  if (listErr) {
    console.warn("Failed to list buckets:", listErr.message);
  }
  const exists = buckets?.some((b) => b.name === bucket);
  if (!exists) {
    const { error: createErr } = await supabaseAdmin.storage.createBucket(bucket, { public: true });
    if (createErr && !/already exists/i.test(createErr.message)) {
      throw createErr;
    }
  }
  return bucket;
}

function isImageContentType(ct) {
  return typeof ct === "string" && ct.startsWith("image/");
}

function isAnimatedGif(ct) {
  return ct === "image/gif";
}

export async function uploadBase64ImageToSupabase({ base64, folder = "uploads", cacheSeconds = 31536000 }) {
  if (!base64 || typeof base64 !== "string" || !base64.includes(",")) {
    throw new Error("Invalid base64 image input");
  }
  const [meta, data] = base64.split(",");
  const m = /data:(.*?);base64/.exec(meta);
  let contentType = m?.[1] || "application/octet-stream";
  let ext = (contentType.split("/")[1] || "bin").toLowerCase();

  let inputBuffer = Buffer.from(data, "base64");
  let outputBuffer = inputBuffer;

  // Compress images to WebP (except animated GIFs)
  if (isImageContentType(contentType) && !isAnimatedGif(contentType)) {
    try {
      outputBuffer = await sharp(inputBuffer).rotate().webp({ quality: 80 }).toBuffer();
      contentType = "image/webp";
      ext = "webp";
    } catch (e) {
      console.warn("Image compression failed; uploading original. Reason:", e.message);
      // fall back to original buffer and contentType
      outputBuffer = inputBuffer;
    }
  }

  const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const bucket = await ensureBucketExists(DEFAULT_BUCKET);

  const { error: uploadErr } = await supabaseAdmin.storage
    .from(bucket)
    .upload(key, outputBuffer, { contentType, upsert: false, cacheControl: String(cacheSeconds) });
  if (uploadErr) throw uploadErr;

  // Public URL (bucket is public)
  const { data: pub } = supabaseAdmin.storage.from(bucket).getPublicUrl(key);
  const url = pub?.publicUrl;

  return { key, url, contentType };
}

export async function removeFromSupabase(key, bucketName = DEFAULT_BUCKET) {
  if (!key) return;
  const { error } = await supabaseAdmin.storage.from(bucketName).remove([key]);
  if (error) throw error;
}
