const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(width, height, r, g, b) {
  // CRC32 table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function writeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crcVal = crc32(buf.slice(4, 8 + len));
    buf.writeUInt32BE(crcVal, 8 + len);
    return buf;
  }

  // PNG Header
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 2; // Truecolor (RGB)
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrChunk = writeChunk('IHDR', ihdrData);

  // Raw image data with scanlines
  const lineSize = 1 + width * 3;
  const rawData = Buffer.alloc(height * lineSize);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.42;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * lineSize;
    rawData[rowOffset] = 0; // Filter type 0
    for (let x = 0; x < width; x++) {
      const idx = rowOffset + 1 + x * 3;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Create rounded badge design with indigo background & golden accent
      if (dist < radius * 0.4) {
        // Gold emblem center
        rawData[idx] = 245;     // R
        rawData[idx + 1] = 158; // G
        rawData[idx + 2] = 11;  // B
      } else if (dist < radius) {
        // Indigo inner
        rawData[idx] = 79;      // R
        rawData[idx + 1] = 70;  // G
        rawData[idx + 2] = 229; // B
      } else {
        // Dark slate outer bg
        rawData[idx] = 15;      // R
        rawData[idx + 1] = 23;  // G
        rawData[idx + 2] = 42;  // B
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = writeChunk('IDAT', compressedData);
  const iendChunk = writeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'icon-192.png'), createPNG(192, 192, 79, 70, 229));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), createPNG(512, 512, 79, 70, 229));
console.log('Successfully generated PWA PNG icons!');
