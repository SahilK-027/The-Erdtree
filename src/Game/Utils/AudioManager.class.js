export default class AudioManager {
  constructor() {
    this.audio = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.volume = 0.5;
    this.introSequence = null;
  }

  setIntroSequence(introSequence) {
    this.introSequence = introSequence;
  }

  init(audioPath) {
    this.audio = new Audio(audioPath);
    this.audio.loop = true;
    this.audio.volume = this.volume;
    
    // Handle audio loading errors
    this.audio.addEventListener('error', (e) => {
      console.error('Error loading audio:', e);
    });
  }

  play() {
    if (!this.audio) return;
    
    const playPromise = this.audio.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.isPlaying = true;
          
          // Start intro sequence if available
          if (this.introSequence) {
            this.introSequence.start();
          }
        })
        .catch((error) => {
          console.warn('Audio play prevented:', error);
          // Browser might block autoplay, user interaction required
        });
    }
  }

  pause() {
    if (!this.audio) return;
    
    this.audio.pause();
    this.isPlaying = false;
    
    // Pause intro sequence
    if (this.introSequence) {
      this.introSequence.pause();
    }
  }

  toggle() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  setVolume(value) {
    if (!this.audio) return;
    
    this.volume = Math.max(0, Math.min(1, value));
    this.audio.volume = this.volume;
  }

  mute() {
    if (!this.audio) return;
    
    this.isMuted = true;
    this.audio.volume = 0;
    
    // Pause intro sequence when muted
    if (this.introSequence) {
      this.introSequence.pause();
    }
  }

  unmute() {
    if (!this.audio) return;
    
    this.isMuted = false;
    this.audio.volume = this.volume;
    
    // Resume intro sequence when unmuted
    if (this.introSequence) {
      this.introSequence.play();
    }
  }

  toggleMute() {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
  }

  stop() {
    if (!this.audio) return;
    
    this.pause();
    this.audio.currentTime = 0;
    
    // Stop intro sequence
    if (this.introSequence) {
      this.introSequence.stop();
    }
  }

  restart() {
    this.stop();
    
    // Restart intro sequence
    if (this.introSequence) {
      this.introSequence.restart();
    }
    
    this.play();
  }

  destroy() {
    if (this.audio) {
      this.stop();
      this.audio = null;
    }
  }
}
