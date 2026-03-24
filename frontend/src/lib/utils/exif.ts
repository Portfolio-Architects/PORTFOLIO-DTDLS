/**
 * Lightweight EXIF DateTimeOriginal extractor.
 * No external dependencies — reads JPEG EXIF APP1 directly from ArrayBuffer.
 * Returns YYYY-MM-DD or null if not found.
 */
export async function extractCapturedDate(file: File): Promise<string | null> {
  try {
    // Only JPEG/HEIC have EXIF; skip others
    if (!file.type.startsWith('image/jpeg') && !file.type.startsWith('image/heic')) {
      // Try lastModified as fallback
      return formatDate(file.lastModified);
    }

    const buf = await file.slice(0, 128 * 1024).arrayBuffer(); // Read first 128KB
    const view = new DataView(buf);

    // Check JPEG SOI marker
    if (view.getUint16(0) !== 0xFFD8) {
      return formatDate(file.lastModified);
    }

    // Find APP1 (EXIF) marker
    let offset = 2;
    while (offset < view.byteLength - 4) {
      const marker = view.getUint16(offset);
      if (marker === 0xFFE1) {
        // APP1 found
        const exifOffset = offset + 4;
        // Check "Exif\0\0"
        const exifHeader = String.fromCharCode(
          view.getUint8(exifOffset),
          view.getUint8(exifOffset + 1),
          view.getUint8(exifOffset + 2),
          view.getUint8(exifOffset + 3),
        );
        if (exifHeader === 'Exif') {
          return parseExifDate(view, exifOffset + 6) ?? formatDate(file.lastModified);
        }
        break;
      }
      if ((marker & 0xFF00) !== 0xFF00) break;
      const segLen = view.getUint16(offset + 2);
      offset += 2 + segLen;
    }

    return formatDate(file.lastModified);
  } catch {
    return formatDate(file.lastModified);
  }
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function parseExifDate(view: DataView, tiffStart: number): string | null {
  try {
    const byteOrder = view.getUint16(tiffStart);
    const isLE = byteOrder === 0x4949; // "II" = little-endian

    const getU16 = (off: number) => view.getUint16(tiffStart + off, isLE);
    const getU32 = (off: number) => view.getUint32(tiffStart + off, isLE);

    // IFD0
    const ifd0Offset = getU32(4);
    const dateFromIFD = searchIFDForDate(view, tiffStart, ifd0Offset, isLE, [0x9003, 0x9004, 0x0132]);
    if (dateFromIFD) return dateFromIFD;

    // Check for ExifIFD pointer (tag 0x8769)
    const ifd0Count = getU16(ifd0Offset);
    for (let i = 0; i < ifd0Count; i++) {
      const entryOff = ifd0Offset + 2 + i * 12;
      const tag = getU16(entryOff);
      if (tag === 0x8769) {
        const exifIFDOffset = getU32(entryOff + 8);
        const dateFromExif = searchIFDForDate(view, tiffStart, exifIFDOffset, isLE, [0x9003, 0x9004]);
        if (dateFromExif) return dateFromExif;
      }
    }

    return null;
  } catch {
    return null;
  }
}

function searchIFDForDate(
  view: DataView,
  tiffStart: number,
  ifdOffset: number,
  isLE: boolean,
  targetTags: number[]
): string | null {
  const getU16 = (off: number) => view.getUint16(tiffStart + off, isLE);
  const getU32 = (off: number) => view.getUint32(tiffStart + off, isLE);

  const count = getU16(ifdOffset);
  for (let i = 0; i < count; i++) {
    const entryOff = ifdOffset + 2 + i * 12;
    if (tiffStart + entryOff + 12 > view.byteLength) break;

    const tag = getU16(entryOff);
    if (!targetTags.includes(tag)) continue;

    const type = getU16(entryOff + 2);
    const numValues = getU32(entryOff + 4);
    if (type !== 2 || numValues < 10) continue; // ASCII type, at least "YYYY:MM:DD"

    const valueOffset = numValues > 4 ? getU32(entryOff + 8) : entryOff + 8;
    const abs = tiffStart + valueOffset;
    if (abs + 10 > view.byteLength) continue;

    // Read date string "YYYY:MM:DD HH:MM:SS"
    let str = '';
    for (let j = 0; j < Math.min(numValues - 1, 19); j++) {
      str += String.fromCharCode(view.getUint8(abs + j));
    }

    // Parse "YYYY:MM:DD" → "YYYY-MM-DD"
    const match = str.match(/^(\d{4}):(\d{2}):(\d{2})/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
  }
  return null;
}
