const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.76;
const MAX_AI_IMAGES = 3;

export async function callAI(action, payload = {}, options = {}) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    signal: options.signal,
    body: JSON.stringify({ action, ...payload })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "AI_REQUEST_FAILED");
    error.code = data.code || "AI_REQUEST_FAILED";
    error.status = response.status;
    throw error;
  }
  return data;
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error("IMAGE_READ_FAILED"));
    reader.readAsDataURL(blob);
  });
}

function canvasBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("IMAGE_COMPRESS_FAILED")), type, quality));
}

async function loadImage(blob) {
  if ("createImageBitmap" in window) return createImageBitmap(blob);
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();
    return image;
  } finally { URL.revokeObjectURL(url); }
}

export async function compressImageForAI(blob) {
  if (!(blob instanceof Blob) || !blob.type.startsWith("image/")) return null;
  const source = await loadImage(blob);
  const width = source.width || source.naturalWidth;
  const height = source.height || source.naturalHeight;
  if (!width || !height) return null;
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d", { alpha: false });
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  source.close?.();
  let output = await canvasBlob(canvas, "image/jpeg", JPEG_QUALITY);
  if (output.size > 950_000) output = await canvasBlob(canvas, "image/jpeg", 0.6);
  return blobToDataURL(output);
}

export async function prepareImagesForAI(blobs) {
  const images = [];
  for (const blob of blobs.filter(item => item instanceof Blob && item.type.startsWith("image/")).slice(0, MAX_AI_IMAGES)) {
    try {
      const data = await compressImageForAI(blob);
      if (data) images.push(data);
    } catch {}
  }
  return images;
}
