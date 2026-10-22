/**
 * Minimal zip reader that runs in the browser with no extra package.
 * Supports normal zips (stored or deflate). Not for encrypted or zip64 files.
 */
export type ZipEntry = { name: string; size: number; read: () => Promise<Uint8Array> }

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const DS = (globalThis as any).DecompressionStream
  if (!DS) throw new Error("This browser cannot open zip files. Please use a recent Chrome.")
  const stream = new Blob([data as any]).stream().pipeThrough(new DS("deflate-raw"))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

export async function readZip(file: Blob): Promise<ZipEntry[]> {
  const buf = new Uint8Array(await file.arrayBuffer())
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  let e = buf.length - 22
  while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--
  if (e < 0) throw new Error("This does not look like a zip file.")
  const count = dv.getUint16(e + 10, true)
  let p = dv.getUint32(e + 16, true)
  const dec = new TextDecoder("utf-8")
  const out: ZipEntry[] = []
  for (let i = 0; i < count; i++) {
    if (dv.getUint32(p, true) !== 0x02014b50) throw new Error("The zip file is damaged.")
    const flags = dv.getUint16(p + 8, true)
    const method = dv.getUint16(p + 10, true)
    const csize = dv.getUint32(p + 20, true)
    const usize = dv.getUint32(p + 24, true)
    const nlen = dv.getUint16(p + 28, true)
    const elen = dv.getUint16(p + 30, true)
    const clen = dv.getUint16(p + 32, true)
    const lho = dv.getUint32(p + 42, true)
    const name = dec.decode(buf.subarray(p + 46, p + 46 + nlen))
    p += 46 + nlen + elen + clen
    if (name.endsWith("/")) continue
    if (flags & 1) throw new Error("Password-protected zips are not supported.")
    out.push({
      name, size: usize,
      read: async () => {
        const nl = dv.getUint16(lho + 26, true)
        const el = dv.getUint16(lho + 28, true)
        const start = lho + 30 + nl + el
        const data = buf.subarray(start, start + csize)
        if (method === 0) return data
        if (method === 8) return inflateRaw(data)
        throw new Error(`Unsupported zip compression in ${name}.`)
      },
    })
  }
  return out
}
