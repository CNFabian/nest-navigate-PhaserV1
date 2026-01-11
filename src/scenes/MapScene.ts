import Phaser from 'phaser';
import { ModulesAPI } from '../services/ModulesAPI';
import { ProgressAPI } from '../services/ProgressAPI';

export class MapScene extends Phaser.Scene {
  private modules: any[] = [];
  private userProgress: any = null;
  private neighborhoods: Phaser.GameObjects.Container[] = [];
  private cameraControls: Phaser.Cameras.Controls.SmoothedKeyControl | null = null;

  constructor() {
    super({ key: 'MapScene' });
  }

  preload() {
    // Load any assets here if you have them
    // For now, we'll use programmatic graphics
  }

  async create() {
    // Show loading
    const loadingText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      'Loading modules...',
      { fontSize: '24px', color: '#000000' }
    );
    loadingText.setOrigin(0.5);
    loadingText.setScrollFactor(0); // Fixed to camera

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

      // Set camera bounds for the map
      this.cameras.main.setBounds(0, 0, 2000, 1500);

      // Create map with real data
      this.createMapBackground();
      this.createNeighborhoodsFromBackend();
      this.setupCameraControls();
      this.addUIText();

    } catch (error) {
      loadingText.setText('Error loading modules\nPlease refresh the page');
      console.error('Failed to load backend data:', error);
    }
  }

  private createMapBackground() {
    // Create a simple gradient background for the map
    const graphics = this.add.graphics();
    
    // Sky gradient (top)
    graphics.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xE0F6FF, 0xE0F6FF, 1);
    graphics.fillRect(0, 0, 2000, 1000);
    
    // Ground (bottom)
    graphics.fillStyle(0x90EE90, 1);
    graphics.fillRect(0, 1000, 2000, 500);
    
    // Add some simple "roads" to show paths between neighborhoods
    graphics.lineStyle(8, 0x696969, 1);
    graphics.lineBetween(0, 800, 2000, 800); // Horizontal road
    graphics.lineBetween(500, 0, 500, 1500); // Vertical road
    graphics.lineBetween(1200, 0, 1200, 1500); // Vertical road
    
    // Add some decorative elements
    this.addDecorations();
  }

  private addDecorations() {
    const graphics = this.add.graphics();
    
    // Add some trees (simple circles)
    const treePositions = [
      { x: 150, y: 900 }, { x: 250, y: 950 }, { x: 350, y: 920 },
      { x: 750, y: 880 }, { x: 850, y: 940 }, { x: 950, y: 910 },
      { x: 1450, y: 900 }, { x: 1550, y: 950 }, { x: 1650, y: 920 }
    ];

    treePositions.forEach(pos => {
      // Tree trunk
      graphics.fillStyle(0x8B4513, 1);
      graphics.fillRect(pos.x - 5, pos.y, 10, 30);
      
      // Tree top
      graphics.fillStyle(0x228B22, 1);
      graphics.fillCircle(pos.x, pos.y, 20);
    });
  }

  private createNeighborhoodsFromBackend() {
    if (!this.modules || this.modules.length === 0) {
      console.warn('No modules loaded from backend');
      return;
    }

    // Position neighborhoods across the map
    const baseX = 300;
    const baseY = 600;
    const spacing = 400;

    this.modules.forEach((module, index) => {
      // Calculate position in a grid pattern
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = baseX + (col * spacing);
      const y = baseY + (row * 300);
      
      // Check if module is unlocked based on progress
      const moduleProgress = this.userProgress?.find((p: any) => 
        p.module.id === module.id
      );
      
      // First module always unlocked, others based on progress
      const unlocked = index === 0 || moduleProgress !== undefined;
      const progressPercentage = moduleProgress?.completion_percentage || '0';
      const isCompleted = progressPercentage === '100';

      const neighborhood = this.createNeighborhood(
        x, 
        y, 
        module.title,
        unlocked,
        isCompleted ? 0xFFD700 : (unlocked ? 0x4CAF50 : 0x9E9E9E),
        module.id,
        progressPercentage
      );

      this.neighborhoods.push(neighborhood);
    });
  }

  private createNeighborhood(
    x: number, 
    y: number, 
    name: string, 
    unlocked: boolean, 
    color: number,
    moduleId: string,
    progressPercentage: string
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Create neighborhood circle background
    const circle = this.add.circle(0, 0, 60, color, unlocked ? 1 : 0.5);
    circle.setStrokeStyle(4, 0xffffff);
    
    // Add house icon (simple representation)
    const houseGraphics = this.add.graphics();
    houseGraphics.fillStyle(0xffffff, unlocked ? 1 : 0.5);
    
    // House body
    houseGraphics.fillRect(-20, -10, 40, 30);
    
    // Roof
    houseGraphics.fillTriangle(0, -30, -30, -10, 30, -10);
    
    // Door
    houseGraphics.fillStyle(0x8B4513, unlocked ? 1 : 0.5);
    houseGraphics.fillRect(-8, 5, 16, 15);
    
    // Windows
    houseGraphics.fillStyle(0x87CEEB, unlocked ? 1 : 0.5);
    houseGraphics.fillRect(-18, -5, 10, 10);
    houseGraphics.fillRect(8, -5, 10, 10);
    
    // Add progress indicator if unlocked
    if (unlocked && progressPercentage !== '0') {
      const progress = parseInt(progressPercentage);
      const progressArc = this.add.graphics();
      progressArc.lineStyle(6, 0xFFFFFF, 0.8);
      progressArc.beginPath();
      progressArc.arc(0, 0, 70, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(-90 + (360 * progress / 100)), false);
      progressArc.strokePath();
      container.add(progressArc);
      
      // Progress text
      const progressText = this.add.text(0, 50, `${progress}%`, {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: '#000000',
        padding: { x: 6, y: 3 }
      });
      progressText.setOrigin(0.5);
      container.add(progressText);
    }
    
    // Add label with word wrap
    const maxWidth = 140;
    const label = this.add.text(0, 110, name, {
      fontSize: '16px',
      color: unlocked ? '#000000' : '#666666',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: maxWidth }
    });
    label.setOrigin(0.5);

    // Add lock icon if locked
    if (!unlocked) {
      const lockText = this.add.text(0, 0, '🔒', {
        fontSize: '32px'
      });
      lockText.setOrigin(0.5);
      container.add(lockText);
    }

    container.add([circle, houseGraphics, label]);

    // Make interactive if unlocked
    if (unlocked) {
      circle.setInteractive({ useHandCursor: true });
      
      circle.on('pointerover', () => {
        this.tweens.add({
          targets: container,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 200,
          ease: 'Power2'
        });
      });

      circle.on('pointerout', () => {
        this.tweens.add({
          targets: container,
          scaleX: 1,
          scaleY: 1,
          duration: 200,
          ease: 'Power2'
        });
      });

      circle.on('pointerdown', () => {
        this.onNeighborhoodClick(name, moduleId);
      });
    }

    return container;
  }

  private setupCameraControls() {
    // Keyboard controls for camera
    const cursors = this.input.keyboard!.createCursorKeys();
    const controlConfig = {
      camera: this.cameras.main,
      left: cursors.left,
      right: cursors.right,
      up: cursors.up,
      down: cursors.down,
      acceleration: 0.06,
      drag: 0.005,
      maxSpeed: 1.0
    };

    this.cameraControls = new Phaser.Cameras.Controls.SmoothedKeyControl(controlConfig);

    // Mouse drag to pan
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      isDragging = true;
      dragStartX = pointer.x;
      dragStartY = pointer.y;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (isDragging && pointer.isDown) {
        const deltaX = pointer.x - dragStartX;
        const deltaY = pointer.y - dragStartY;
        
        this.cameras.main.scrollX -= deltaX / this.cameras.main.zoom;
        this.cameras.main.scrollY -= deltaY / this.cameras.main.zoom;
        
        dragStartX = pointer.x;
        dragStartY = pointer.y;
      }
    });

    this.input.on('pointerup', () => {
      isDragging = false;
    });

    // Mouse wheel to zoom
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any[], deltaX: number, deltaY: number) => {
      const zoomAmount = deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Phaser.Math.Clamp(this.cameras.main.zoom + zoomAmount, 0.5, 2);
      this.cameras.main.setZoom(newZoom);
    });
  }

  private addUIText() {
    // Fixed position instructions (doesn't move with camera)
    const instructions = this.add.text(20, 20, 
      'Navigate Map:\n• Click & Drag to pan\n• Arrow keys to move\n• Mouse wheel to zoom\n• Click neighborhoods to view details', 
      {
        fontSize: '14px',
        color: '#000000',
        backgroundColor: '#ffffff',
        padding: { x: 10, y: 10 }
      }
    );
    instructions.setAlpha(0.9);
    instructions.setScrollFactor(0); // Fixed to camera
    
    // Title
    const title = this.add.text(
      this.cameras.main.width / 2,
      30,
      'Learning Journey Map',
      {
        fontSize: '32px',
        color: '#000000',
        fontStyle: 'bold',
        backgroundColor: '#ffffff',
        padding: { x: 20, y: 10 }
      }
    );
    title.setOrigin(0.5);
    title.setScrollFactor(0);
  }

  private onNeighborhoodClick(name: string, moduleId: string) {
    console.log(`Clicked neighborhood: ${name} (Module ID: ${moduleId})`);
    
    // Show notification
    const notification = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      `${name}\n\nModule ID: ${moduleId}\n\n(Neighborhood view not implemented yet)`,
      {
        fontSize: '24px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 20, y: 15 },
        align: 'center'
      }
    );
    notification.setOrigin(0.5);
    notification.setScrollFactor(0);

    // Fade out after 2 seconds
    this.tweens.add({
      targets: notification,
      alpha: 0,
      duration: 1000,
      delay: 2000,
      onComplete: () => notification.destroy()
    });
  }

  update(time: number, delta: number) {
    // Update camera controls (only if initialized)
    if (this.cameraControls) {
      this.cameraControls.update(delta);
    }
  }
}