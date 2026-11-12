// Sound engine. Everything is synthesized with the Web Audio API, so there are no audio
// files to download and no licensing questions. To use a real music file later, replace
// startMusic()/stopMusic() only; the rest of the app never touches Web Audio directly.

export type SfxName =
  | 'tap'
  | 'nav'
  | 'toggle'
  | 'correct'
  | 'wrong'
  | 'heartLost'
  | 'star'
  | 'complete'
  | 'fail'
  | 'powerUp';

const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// A slow, soft C-major loop: four chords, one bar each (8 steps per bar).
const CHORDS: number[][] = [
  [48, 52, 55, 59], // Cmaj7
  [45, 48, 52, 55], // Am7
  [41, 45, 48, 52], // Fmaj7
  [43, 47, 50, 52], // G6
];
const ARP = [0, 2, 1, 3, 2, 1, 3, 2];
const PENTATONIC = [72, 74, 76, 79, 81, 84]; // C5 D5 E5 G5 A5 C6

const BPM = 72;
const STEP = 60 / BPM / 2; // eighth notes
const LOOKAHEAD = 0.5; // seconds scheduled ahead
const TICK_MS = 120;

const MUSIC_LEVEL = 0.2;
const SFX_LEVEL = 0.9;

type WindowWithWebkit = Window & { webkitAudioContext?: typeof AudioContext };

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;

  private musicOn = true;
  private sfxOn = true;
  private unlocked = false;

  private timer: ReturnType<typeof setInterval> | null = null;
  private nextTime = 0;
  private step = 0;

  /** Must be called from a user gesture (browsers block audio before the first tap). */
  unlock() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as WindowWithWebkit).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();

      this.master = this.ctx.createGain();
      this.master.gain.value = 1;
      this.master.connect(this.ctx.destination);

      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = 0;
      this.musicBus.connect(this.master);

      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = SFX_LEVEL;
      this.sfxBus.connect(this.master);
    }
    void this.ctx.resume();
    this.unlocked = true;
    if (this.musicOn) this.startMusic();
  }

  setMusicOn(on: boolean) {
    this.musicOn = on;
    if (!this.unlocked) return;
    if (on) this.startMusic();
    else this.stopMusic();
  }

  setSfxOn(on: boolean) {
    this.sfxOn = on;
  }

  /** Pause everything while the tab is hidden, resume when it comes back. */
  setHidden(hidden: boolean) {
    if (!this.ctx || !this.unlocked) return;
    if (hidden) void this.ctx.suspend();
    else void this.ctx.resume();
  }

  // ------------------------------------------------------------------ music
  private startMusic() {
    if (!this.ctx || !this.musicBus || this.timer) {
      this.fadeMusic(MUSIC_LEVEL);
      return;
    }
    this.nextTime = this.ctx.currentTime + 0.1;
    this.step = 0;
    this.fadeMusic(MUSIC_LEVEL);
    this.timer = setInterval(() => this.schedule(), TICK_MS);
    this.schedule();
  }

  private stopMusic() {
    this.fadeMusic(0);
    if (this.timer) {
      const t = this.timer;
      this.timer = null;
      // Let the fade finish, then stop scheduling.
      setTimeout(() => clearInterval(t), 600);
    }
  }

  private fadeMusic(target: number) {
    if (!this.ctx || !this.musicBus) return;
    this.musicBus.gain.cancelScheduledValues(this.ctx.currentTime);
    this.musicBus.gain.setTargetAtTime(target, this.ctx.currentTime, 0.2);
  }

  private schedule() {
    if (!this.ctx || !this.musicBus) return;
    while (this.nextTime < this.ctx.currentTime + LOOKAHEAD) {
      this.playStep(this.step, this.nextTime);
      this.nextTime += STEP;
      this.step += 1;
    }
  }

  private playStep(step: number, time: number) {
    const bar = Math.floor(step / 8) % CHORDS.length;
    const inBar = step % 8;
    const chord = CHORDS[bar];

    // Soft pad on the first step of each bar.
    if (inBar === 0) {
      for (const n of chord.slice(0, 3)) this.padNote(midi(n + 12), time, STEP * 8);
    }
    // Gentle arpeggio.
    this.pluck(midi(chord[ARP[inBar]] + 12), time, 0.1);
    // An occasional melody note, never on every step.
    if (inBar % 2 === 1 && Math.random() < 0.45) {
      const n = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)];
      this.pluck(midi(n), time, 0.07);
    }
  }

  private pluck(freq: number, time: number, level: number) {
    if (!this.ctx || !this.musicBus) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(level, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.9);
    osc.connect(gain).connect(this.musicBus);
    osc.start(time);
    osc.stop(time + 1);
  }

  private padNote(freq: number, time: number, dur: number) {
    if (!this.ctx || !this.musicBus) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(0.05, time + 0.8);
    gain.gain.linearRampToValueAtTime(0.0001, time + dur);
    osc.connect(gain).connect(this.musicBus);
    osc.start(time);
    osc.stop(time + dur + 0.1);
  }

  // ------------------------------------------------------------------- sfx
  private tone(
    freq: number,
    start: number,
    dur: number,
    opts: { type?: OscillatorType; gain?: number; endFreq?: number } = {},
  ) {
    if (!this.ctx || !this.sfxBus) return;
    const { type = 'sine', gain = 0.25, endFreq } = opts;
    const t = this.ctx.currentTime + start;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.sfxBus);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  play(name: SfxName) {
    if (!this.sfxOn || !this.ctx || !this.unlocked) return;
    switch (name) {
      case 'tap':
      case 'toggle':
        this.tone(560, 0, 0.08, { gain: 0.16, endFreq: 720 });
        break;
      case 'nav':
        this.tone(440, 0, 0.09, { type: 'triangle', gain: 0.14 });
        this.tone(587, 0.07, 0.12, { type: 'triangle', gain: 0.14 });
        break;
      case 'correct':
        [523.25, 659.25, 783.99].forEach((f, i) =>
          this.tone(f, i * 0.09, 0.3, { type: 'triangle', gain: 0.22 }),
        );
        this.tone(1318.5, 0.27, 0.35, { gain: 0.08 });
        break;
      case 'wrong':
        // Soft and kind: two gentle falling notes, no buzzer.
        this.tone(330, 0, 0.22, { type: 'triangle', gain: 0.14 });
        this.tone(262, 0.14, 0.3, { type: 'triangle', gain: 0.14 });
        break;
      case 'heartLost':
        this.tone(392, 0, 0.35, { gain: 0.18, endFreq: 196 });
        break;
      case 'star':
        this.tone(880, 0, 0.4, { gain: 0.16 });
        this.tone(1320, 0, 0.3, { gain: 0.07 });
        break;
      case 'powerUp':
        this.tone(400, 0, 0.35, { type: 'triangle', gain: 0.16, endFreq: 1200 });
        this.tone(1568, 0.3, 0.3, { gain: 0.1 });
        break;
      case 'complete':
        [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
          this.tone(f, i * 0.11, 0.55, { type: 'triangle', gain: 0.2 }),
        );
        break;
      case 'fail':
        [392, 330, 262, 220].forEach((f, i) =>
          this.tone(f, i * 0.18, 0.4, { type: 'triangle', gain: 0.14 }),
        );
        break;
    }
  }
}

let instance: AudioEngine | null = null;
export const getAudio = () => (instance ??= new AudioEngine());
