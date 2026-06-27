const fs = require('fs');
const path = require('path');

function writeWav(filename, generateSample, duration, sampleRate = 44100) {
  const numSamples = Math.floor(duration * sampleRate);
  const numChannels = 1;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;

  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bytesPerSample * 8, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = generateSample(t);
    const val = Math.max(-1, Math.min(1, sample));
    buffer.writeInt16LE(Math.floor(val * 32767), 44 + i * 2);
  }

  fs.writeFileSync(filename, buffer);
}

const outDir = path.join(__dirname, 'assets', 'sounds');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. beep.wav - 1kHz sine wave pulsing
writeWav(path.join(outDir, 'beep.wav'), t => {
  const pulse = Math.sin(2 * Math.PI * 4 * t) > 0 ? 1 : 0;
  return Math.sin(2 * Math.PI * 1000 * t) * pulse * Math.exp(-t);
}, 2);

// 2. chime.wav - harmonic rich, decaying
writeWav(path.join(outDir, 'chime.wav'), t => {
  const f = 800;
  let val = Math.sin(2 * Math.PI * f * t) * 0.5;
  val += Math.sin(2 * Math.PI * f * 1.5 * t) * 0.25;
  val += Math.sin(2 * Math.PI * f * 2 * t) * 0.125;
  return val * Math.exp(-t * 3);
}, 2);

// 3. digital.wav - fast arpeggio square wave
writeWav(path.join(outDir, 'digital.wav'), t => {
  const freqs = [440, 554, 659, 880];
  const idx = Math.floor(t * 8) % freqs.length;
  const f = freqs[idx];
  return (Math.sin(2 * Math.PI * f * t) > 0 ? 0.3 : -0.3) * Math.exp(-t * 0.5);
}, 2);

// 4. matrix.wav - creepy low frequency modulation (glitchy)
writeWav(path.join(outDir, 'matrix.wav'), t => {
  const mod = Math.sin(2 * Math.PI * 5 * t);
  const f = 200 + mod * 50;
  let val = Math.sin(2 * Math.PI * f * t);
  // add some noise
  val += (Math.random() * 0.2 - 0.1);
  return val * 0.8;
}, 3);

// 5. echo.wav - delayed sine pings
writeWav(path.join(outDir, 'echo.wav'), t => {
  const ping = (time, freq) => {
    if (time < 0) return 0;
    return Math.sin(2 * Math.PI * freq * time) * Math.exp(-time * 5);
  };
  return ping(t, 1200) * 0.6 + ping(t - 0.3, 1200) * 0.3 + ping(t - 0.6, 1200) * 0.15;
}, 3);

console.log('Successfully generated 5 WAV files in assets/sounds/');
