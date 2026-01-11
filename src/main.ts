import Phaser from 'phaser';
import { MapScene } from './scenes/MapScene';
import { AuthService } from './services/AuthService';

// Check if user is authenticated before starting Phaser
const token = AuthService.getToken();

if (!token) {
  console.error('No authentication token found');
  // Redirect to login page
  window.location.href = '/auth/login';
} else {
  // User is authenticated, initialize Phaser
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: window.innerWidth - 192, // Subtract sidebar width
    height: window.innerHeight,
    backgroundColor: '#ffffff',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false
      }
    },
    scene: [MapScene],
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH
    }
  };

  // Initialize Phaser game
  const game = new Phaser.Game(config);

  // Handle window resize
  window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth - 192, window.innerHeight);
  });

  // Export game instance for debugging
  (window as any).game = game;
}