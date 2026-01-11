import { ModulesAPI } from '../services/ModulesAPI';
import { ProgressAPI } from '../services/ProgressAPI';

export class MapScene extends Phaser.Scene {
  private modules: any[] = [];
  private userProgress: any = null;

  async create() {
    // Show loading
    const loadingText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      'Loading modules...',
      { fontSize: '24px' }
    );
    loadingText.setOrigin(0.5);

    try {
      // Fetch real data from backend
      const [modules, progress] = await Promise.all([
        ModulesAPI.getModules(),
        ProgressAPI.getUserModuleProgress()
      ]);

      this.modules = modules;
      this.userProgress = progress;

      // Remove loading text
      loadingText.destroy();

      // Create map with real data
      this.createMapBackground();
      this.createNeighborhoodsFromBackend();
      this.setupCameraControls();
      this.addUIText();

    } catch (error) {
      loadingText.setText('Error loading modules');
      console.error('Failed to load backend data:', error);
    }
  }

  private createNeighborhoodsFromBackend() {
    // Convert backend modules to neighborhood positions
    this.modules.forEach((module, index) => {
      const x = 300 + (index * 400);
      const y = 600;
      
      // Check if module is unlocked based on progress
      const moduleProgress = this.userProgress.find((p: any) => 
        p.module.id === module.id
      );
      const unlocked = moduleProgress ? true : index === 0; // First module always unlocked

      const neighborhood = this.createNeighborhood(
        x, 
        y, 
        module.title,
        unlocked,
        unlocked ? 0x4CAF50 : 0x9E9E9E,
        module.id // Store module ID for API calls
      );

      this.neighborhoods.push(neighborhood);
    });
  }
}