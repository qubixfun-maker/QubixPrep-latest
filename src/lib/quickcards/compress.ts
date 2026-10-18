// Browser-only image helpers for QuickCards uploads.

export interface CompressedImage {
  blob: Blob
  ext: 'webp' | 'jpg'
  contentType: string
}

async function loadBitmap(file: File): Promise<ImageBitmap> {
  return await createImageBitmap(file)
}

function drawScaled(bitmap: ImageBitmap, maxWidth: number): HTMLCanvasElement {
  const scale = Math.min(1, maxWidth / bitmap.width)
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not supported in this browser.')
  // White background so transparent PNGs do not turn black when converted
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, w, h)
  return canvas
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality))
}

async function encode(canvas: HTMLCanvasElement, quality: number, maxBytes: number): Promise<CompressedImage> {
  let q = quality
  // Prefer WebP; fall back to JPEG if the browser cannot encode WebP
  let blob = await canvasToBlob(canvas, 'image/webp', q)
  let type = 'image/webp'
  let ext: 'webp' | 'jpg' = 'webp'
  if (!blob || blob.type !== 'image/webp') {
    blob = await canvasToBlob(canvas, 'image/jpeg', q)
    type = 'image/jpeg'
    ext = 'jpg'
  }
  while (blob && blob.size > maxBytes && q > 0.5) {
    q -= 0.08
    blob = await canvasToBlob(canvas, type, q)
  }
  if (!blob) throw new Error('Could not compress the image.')
  return { blob, ext, contentType: type }
}

/** Full-size card image: max 1600px wide, kept under ~2.8 MB (Storage rule limit is 3 MB). */
export async function compressCardImage(file: File): Promise<CompressedImage> {
  const bitmap = await loadBitmap(file)
  try {
    return await encode(drawScaled(bitmap, 1600), 0.84, 2.8 * 1024 * 1024)
  } finally {
    bitmap.close()
  }
}

/** Small grid thumbnail (480px wide). */
export async function makeThumbnail(file: File): Promise<CompressedImage> {
  const bitmap = await loadBitmap(file)
  try {
    return await encode(drawScaled(bitmap, 480), 0.78, 400 * 1024)
  } finally {
    bitmap.close()
  }
}

/** Tiny blurred placeholder (about 20px wide) stored as a data URL on the card. */
export async function makeBlurData(file: File): Promise<string> {
  const bitmap = await loadBitmap(file)
  try {
    const canvas = drawScaled(bitmap, 20)
    return canvas.toDataURL('image/jpeg', 0.5)
  } finally {
    bitmap.close()
  }
}
