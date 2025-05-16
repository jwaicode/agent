// Audio processing utilities for Whisper-compatible recording
class AudioProcessor {
    constructor() {
        this.audioContext = null;
        this.processor = null;
        this.input = null;
        this.audioData = [];
        this.recording = false;
    }

    async startRecording() {
        // Initialize audio context at 44.1kHz (standard sample rate)
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 44100 });
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.input = this.audioContext.createMediaStreamSource(stream);

        // Create script processor for raw audio access
        this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
        this.input.connect(this.processor);
        this.processor.connect(this.audioContext.destination);

        // Handle audio processing
        this.processor.onaudioprocess = (e) => {
            if (!this.recording) return;
            const channelData = e.inputBuffer.getChannelData(0);
            this.audioData.push(new Float32Array(channelData));
        };

        this.audioData = [];
        this.recording = true;
    }

    async stopRecording() {
        this.recording = false;
        this.processor.disconnect();
        this.input.disconnect();
        await this.audioContext.close();

        // Convert to 16kHz WAV format (Whisper-compatible)
        return this.exportWAV(this.audioData, 16000);
    }

    mergeBuffers(buffers) {
        const length = buffers.reduce((acc, cur) => acc + cur.length, 0);
        const result = new Float32Array(length);
        let offset = 0;
        for (let buffer of buffers) {
            result.set(buffer, offset);
            offset += buffer.length;
        }
        return result;
    }

    downsampleBuffer(buffer, rateIn, rateOut) {
        if (rateOut >= rateIn) return buffer;
        const ratio = rateIn / rateOut;
        const length = Math.floor(buffer.length / ratio);
        const result = new Float32Array(length);
        for (let i = 0; i < length; i++) {
            result[i] = buffer[Math.floor(i * ratio)];
        }
        return result;
    }

    exportWAV(buffers, targetSampleRate) {
        const merged = this.mergeBuffers(buffers);
        const downsampled = this.downsampleBuffer(merged, 44100, targetSampleRate);
        const wav = this.encodeWAV(downsampled, targetSampleRate);
        return new Blob([wav], { type: 'audio/wav' });
    }

    encodeWAV(samples, sampleRate) {
        const buffer = new ArrayBuffer(44 + samples.length * 2);
        const view = new DataView(buffer);

        const writeString = (offset, str) => {
            for (let i = 0; i < str.length; i++) {
                view.setUint8(offset + i, str.charCodeAt(i));
            }
        };

        // Write WAV header
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + samples.length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);    // Subchunk1Size
        view.setUint16(20, 1, true);     // PCM format
        view.setUint16(22, 1, true);     // Mono channel
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);  // ByteRate
        view.setUint16(32, 2, true);     // BlockAlign
        view.setUint16(34, 16, true);    // BitsPerSample
        writeString(36, 'data');
        view.setUint32(40, samples.length * 2, true);

        // Write audio data
        let offset = 44;
        for (let i = 0; i < samples.length; i++) {
            let s = Math.max(-1, Math.min(1, samples[i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            offset += 2;
        }

        return view;
    }
}

// Export for use in other files
window.AudioProcessor = AudioProcessor;