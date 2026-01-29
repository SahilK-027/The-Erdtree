import Game from './Game/Game.class';
import ResourceLoader from './Game/Utils/ResourceLoader.class';
import AudioManager from './Game/Utils/AudioManager.class';
import LoaderBackground from './Game/Utils/LoaderBackground.class';
import ASSETS from './Config/assets.js';

const isDebugMode =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('mode') === 'debug';

const progressBar = document.getElementById('bar');
const loaderScreen = document.getElementById('loader-screen');
const hud = document.getElementById('hud');
const exploreButtons = document.getElementById('explore-buttons');
const exploreWithAudio = document.getElementById('explore-with-audio');
const exploreWithoutAudio = document.getElementById('explore-without-audio');
const loaderText = document.querySelector('.loader-text');
const audioControls = document.getElementById('audio-controls');
const muteBtn = document.getElementById('mute-btn');
const volumeIconPath = document.getElementById('volume-icon-path');
const resources = new ResourceLoader(ASSETS);
const audioManager = new AudioManager();

// Icon paths
const VOLUME_ICON = 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z';
const MUTE_ICON = 'M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z';

// Initialize loader background
const loaderBackground = new LoaderBackground('loader-bg');

resources.on('progress', ({ id, itemsLoaded, itemsTotal, percent }) => {
  progressBar.style.width = `${percent.toFixed(1)}%`;
  if (isDebugMode) {
    console.log(
      `Loaded asset: "${id}" (${itemsLoaded}/${itemsTotal} — ${percent.toFixed(
        1,
      )}%)`,
    );
  }
});

resources.on('error', ({ id, url, itemsLoaded, itemsTotal }) => {
  console.error(
    `❌ Failed to load item named "${id}" at "${url}" (${itemsLoaded}/${itemsTotal} so far)`,
  );
});

let gameInstance = null;

resources.on('loaded', () => {
  if (isDebugMode) {
    if (Object.keys(resources.items).length) {
      console.log('✅ All assets are loaded. Waiting for user to explore…');
    } else {
      console.log('☑️ No asset to load. Waiting for user to explore…');
    }
  }

  // Initialize game but don't show it yet
  gameInstance = new Game(document.getElementById('three'), resources, isDebugMode);

  // Initialize audio with the loaded music path
  audioManager.init('/assets/music/jungle-forest-wildlife-background-music-326441.mp3');
  
  // Connect intro sequence to audio manager
  if (gameInstance && gameInstance.world && gameInstance.world.introSequence) {
    audioManager.setIntroSequence(gameInstance.world.introSequence);
  }

  // Hide loading text and show explore buttons
  loaderText.style.opacity = '0';
  setTimeout(() => {
    exploreButtons.classList.add('visible');
  }, 300);
});

// Handle explore with audio button click
exploreWithAudio.addEventListener('click', () => {
  startExploration(true);
});

// Handle explore without audio button click
exploreWithoutAudio.addEventListener('click', () => {
  startExploration(false);
});

function startExploration(withAudio) {
  // Dispose loader background
  if (loaderBackground) {
    loaderBackground.dispose();
  }

  // Hide loader screen and show HUD
  loaderScreen.classList.add('hidden');
  hud.classList.add('visible');
  audioControls.classList.add('visible');
  
  // Start camera intro animation
  if (gameInstance && gameInstance.camera) {
    gameInstance.camera.startIntroAnimation();
  }
  
  if (withAudio) {
    // Start playing music (this will also trigger intro after 3s)
    audioManager.play();
    
    if (isDebugMode) {
      console.log('🎮 Starting exploration with audio!');
    }
  } else {
    // Don't play music, but controls are still available
    // Set button to muted state
    volumeIconPath.setAttribute('d', MUTE_ICON);
    muteBtn.classList.add('muted');
    
    if (isDebugMode) {
      console.log('🎮 Starting exploration without audio!');
    }
  }
}

// Audio control handlers
if (muteBtn) {
  muteBtn.addEventListener('click', () => {
    // If audio is not playing, start it first
    if (!audioManager.isPlaying) {
      audioManager.play();
      volumeIconPath.setAttribute('d', VOLUME_ICON);
      muteBtn.classList.remove('muted');
    } else {
      // Toggle mute if already playing
      audioManager.toggleMute();
      
      if (audioManager.isMuted) {
        volumeIconPath.setAttribute('d', MUTE_ICON);
        muteBtn.classList.add('muted');
      } else {
        volumeIconPath.setAttribute('d', VOLUME_ICON);
        muteBtn.classList.remove('muted');
      }
    }
  });
}

// Update time in HUD
function updateTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const timeElement = document.getElementById('time');
  if (timeElement) {
    timeElement.textContent = `${hours}:${minutes}`;
  }
}

updateTime();
setInterval(updateTime, 1000);

// Update FPS counter (optional - can be connected to actual game FPS)
let lastTime = performance.now();
let frames = 0;
function updateFPS() {
  frames++;
  const currentTime = performance.now();
  if (currentTime >= lastTime + 1000) {
    const fpsElement = document.getElementById('fps');
    if (fpsElement) {
      fpsElement.textContent = Math.round(
        (frames * 1000) / (currentTime - lastTime),
      );
    }
    frames = 0;
    lastTime = currentTime;
  }
  requestAnimationFrame(updateFPS);
}
updateFPS();
