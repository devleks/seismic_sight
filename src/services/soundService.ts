/**
 * Simple sound service using Web Audio API to provide feedback
 * without external assets.
 */

class SoundService {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number) {
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playScan() {
    this.playTone(880, 'sine', 0.1, 0.1);
    setTimeout(() => this.playTone(1320, 'sine', 0.1, 0.05), 50);
  }

  playHazard() {
    this.playTone(440, 'sawtooth', 0.2, 0.1);
    setTimeout(() => this.playTone(330, 'sawtooth', 0.3, 0.1), 100);
  }

  playShutter() {
    this.playTone(2000, 'square', 0.05, 0.05);
  }

  playSuccess() {
    this.playTone(523.25, 'sine', 0.1, 0.1); // C5
    setTimeout(() => this.playTone(659.25, 'sine', 0.1, 0.1), 100); // E5
    setTimeout(() => this.playTone(783.99, 'sine', 0.2, 0.1), 200); // G5
  }

  playCancel() {
    this.playTone(200, 'sine', 0.2, 0.1);
    setTimeout(() => this.playTone(150, 'sine', 0.2, 0.1), 100);
  }
}

export const sounds = new SoundService();
