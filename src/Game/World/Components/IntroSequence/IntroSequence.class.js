export default class IntroSequence {
  constructor() {
    this.audio = null;
    this.isPlaying = false;
    this.hasPlayed = false;
    this.currentCaptionIndex = -1;
    this.startTimeout = null;
    
    // Caption timings synchronized with the narration (in seconds)
    this.captions = [
      { start: 0, end: 2.5, text: "The fallen leaves tell a story." },
      { start: 2.5, end: 4.5, text: "The Great Elden Ring was shattered." },
      { start: 4.5, end: 6.5, text: "In our home across the fog." },
      { start: 6.5, end: 8.5, text: "The lands between." },
      { start: 8.5, end: 13.5, text: "Now, Queen Marika the Eternal is nowhere to be found," },
      { start: 13.5, end: 19.0, text: "and in the night of the black knives, Godwyn the Golden was first to perish." },
      { start: 19.0, end: 25, text: "Soon, Marika's offspring, the demigods all, claimed the shards of the Elden Ring." },
      { start: 25, end: 29, text: "The mad taint of their newfound strength triggered the shattering." },
      { start: 29, end: 35, text: "A war from which no lord arose—a war leading to abandonment by the greater will." },
      { start: 35, end: 41, text: "Arise now, ye tarnished, ye dead, yet live." },
      { start: 41, end: 43, text: "The call of a long-lost race speaks to us all." },
      { start: 43, end: 47, text: "Hoarah Loux, chieftain of the badlands." },
      { start: 47, end: 49, text: "The ever-brilliant Goldmask." },
      { start: 49, end: 51, text: "Fia, the deathbed companion." },
      { start: 51, end: 53, text: "The loathsome Dung Eater." },
      { start: 53, end: 57, text: "And Sir Gideon Ofnir, the all-knowing...." },
      { start: 57, end: 62, text: "And one other, whom grace would again bless, a tarnished of no renown." },
      { start: 62, end: 68, text: "Cross the fog to the lands between, to stand before the Elden Ring..." },
      { start: 68, end: 71, text: "and become the Elden Lord." }
    ];
    
    this.createUI();
    this.setupAudio();
  }

  createUI() {
    // Create caption backdrop for better readability
    this.captionBackdrop = document.createElement('div');
    this.captionBackdrop.id = 'intro-caption-backdrop';
    this.captionBackdrop.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 25%;
      opacity: 0;
      transition: opacity 0.8s ease-in-out;
      pointer-events: none;
      z-index: 149;
    `;
    
    // Create caption container (no overlay, just captions)
    this.captionContainer = document.createElement('div');
    this.captionContainer.id = 'intro-caption';
    this.captionContainer.style.cssText = `
      position: fixed;
      bottom: 6%;
      left: 50%;
      transform: translateX(-50%);
      width: 85%;
      max-width: 1000px;
      text-align: center;
      font-family: 'Cinzel', serif;
      font-size: clamp(0.6rem, 2.8vw, 1.2rem);
      font-weight: 500;
      color: #f4e4c1;
      line-height: 1.9;
      text-shadow: 
        0 0 1px rgba(0, 0, 0, 1),
        1px 1px 2px rgba(0, 0, 0, 1),
        2px 2px 4px rgba(0, 0, 0, 0.9),
        3px 3px 6px rgba(0, 0, 0, 0.8),
        0 0 30px rgba(212, 175, 55, 0.5),
        0 0 40px rgba(0, 0, 0, 0.6);
      opacity: 0;
      transition: opacity 0.8s ease-in-out;
      pointer-events: none;
      letter-spacing: 0.08em;
      z-index: 150;
      padding: 1rem 2rem;
      border-radius: 4px;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(212, 175, 55, 0.15);
      box-shadow: 
        0 4px 20px rgba(0, 0, 0, 0.5),
        inset 0 1px 0 rgba(255, 255, 255, 0.05);
    `;
    
    // Add responsive styles
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 768px) {
        #intro-caption {
          font-size: clamp(0.9rem, 2.2vw, 1.2rem) !important;
          width: 88% !important;
          padding: 1rem 1.5rem !important;
        }
        #intro-caption-backdrop {
          height: 30% !important;
        }
      }
      @media (max-width: 480px) {
        #intro-caption {
          font-size: clamp(0.8rem, 2vw, 1rem) !important;
          width: 90% !important;
          padding: 0.8rem 1rem !important;
        }
        #intro-caption-backdrop {
          height: 35% !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(this.captionBackdrop);
    document.body.appendChild(this.captionContainer);
  }

  setupAudio() {
    this.audio = new Audio('/assets/music/ElevenLabs_2026-01-29T12_08_10_Nigel Graves - Mysterious, Deep Narrator_pvc_sp94_s50_sb75_se0_b_m2.mp3');
    this.audio.volume = 0.7;
    
    this.audio.addEventListener('timeupdate', () => {
      this.updateCaption();
    });
    
    this.audio.addEventListener('ended', () => {
      this.end();
    });
    
    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
    });
    
    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
    });
  }

  start() {
    // Start after 3 seconds
    this.startTimeout = setTimeout(() => {
      const playPromise = this.audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.hasPlayed = true;
          })
          .catch((error) => {
            console.warn('Intro audio play prevented:', error);
          });
      }
    }, 3000);
  }

  pause() {
    if (this.audio && this.isPlaying) {
      this.audio.pause();
      this.hideCaption();
    }
  }

  play() {
    if (this.audio && !this.isPlaying) {
      // If hasn't played yet, start from beginning after 3s
      if (!this.hasPlayed) {
        this.start();
      } else {
        // Resume from where it was
        this.audio.play();
      }
    }
  }

  stop() {
    if (this.startTimeout) {
      clearTimeout(this.startTimeout);
      this.startTimeout = null;
    }
    
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.isPlaying = false;
      this.hasPlayed = false;
      this.hideCaption();
    }
  }

  restart() {
    this.stop();
    this.start();
  }

  updateCaption() {
    const currentTime = this.audio.currentTime;
    
    // Find the current caption
    for (let i = 0; i < this.captions.length; i++) {
      const caption = this.captions[i];
      
      if (currentTime >= caption.start && currentTime < caption.end) {
        if (this.currentCaptionIndex !== i) {
          this.currentCaptionIndex = i;
          this.showCaption(caption.text);
        }
        return;
      }
    }
    
    // Hide caption if not in any range
    if (this.currentCaptionIndex !== -1) {
      this.hideCaption();
      this.currentCaptionIndex = -1;
    }
  }

  showCaption(text) {
    // Show backdrop
    this.captionBackdrop.style.opacity = '1';
    
    // First fade out if there's existing text
    if (this.captionContainer.textContent && this.captionContainer.textContent !== text) {
      this.captionContainer.style.opacity = '0';
      
      // Wait for fade out, then change text and fade in
      setTimeout(() => {
        this.captionContainer.textContent = text;
        // Force reflow to ensure transition works
        this.captionContainer.offsetHeight;
        this.captionContainer.style.opacity = '1';
      }, 400);
    } else {
      // No existing text, just fade in
      this.captionContainer.textContent = text;
      // Force reflow
      this.captionContainer.offsetHeight;
      this.captionContainer.style.opacity = '1';
    }
  }

  hideCaption() {
    this.captionContainer.style.opacity = '0';
    this.captionBackdrop.style.opacity = '0';
  }

  end() {
    this.hideCaption();
    this.hasPlayed = true;
  }

  destroy() {
    if (this.startTimeout) {
      clearTimeout(this.startTimeout);
    }
    
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
    
    if (this.captionBackdrop && this.captionBackdrop.parentNode) {
      this.captionBackdrop.parentNode.removeChild(this.captionBackdrop);
    }
    
    if (this.captionContainer && this.captionContainer.parentNode) {
      this.captionContainer.parentNode.removeChild(this.captionContainer);
    }
  }
}
