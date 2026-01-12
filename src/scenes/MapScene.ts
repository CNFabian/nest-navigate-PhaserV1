import Phaser from 'phaser';
import { ModulesAPI } from '../services/ModulesAPI';
import { ProgressAPI } from '../services/ProgressAPI';

export class MapScene extends Phaser.Scene {
  private modules: any[] = [];
  private userProgress: any = null;
  private neighborhoods: Phaser.GameObjects.Container[] = [];
  private cameraControls: Phaser.Cameras.Controls.SmoothedKeyControl | null = null;
  
  // Tutorial properties
  private tutorialActive: boolean = false;
  private tutorialStep: number = 0;
  private tutorialBox: Phaser.GameObjects.Container | null = null;
  private tutorialButton: Phaser.GameObjects.Container | null = null;

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
      this.createTutorialButton();

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

  private createTutorialButton() {
    const buttonWidth = 120;
    const buttonHeight = 40;
    const padding = 20;

    const container = this.add.container(
      this.cameras.main.width - buttonWidth - padding,
      padding
    );
    container.setScrollFactor(0);
    container.setDepth(1000);

    // Button background
    const bg = this.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x4CAF50);
    bg.setInteractive({ useHandCursor: true });

    // Button text
    const text = this.add.text(0, 0, 'Tutorial', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    text.setOrigin(0.5);

    container.add([bg, text]);

    // Hover effects
    bg.on('pointerover', () => {
      bg.setFillStyle(0x45a049);
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(0x4CAF50);
    });

    bg.on('pointerdown', () => {
      this.startTutorial();
    });

    this.tutorialButton = container;
  }

  private startTutorial() {
    this.tutorialActive = true;
    this.tutorialStep = 0;
    this.showTutorialStep();
  }

  private showTutorialStep() {
    // Remove existing tutorial box if any
    if (this.tutorialBox) {
      this.tutorialBox.destroy();
      this.tutorialBox = null;
    }

    const tutorialSteps = [
      {
        title: 'Welcome to Your Learning Journey!',
        text: 'Hi there! I\'m Nesty, your guide! This is your personalized learning map. Each neighborhood represents a different module with lessons to complete.'
      },
      {
        title: 'Navigation Controls',
        text: 'Let me show you how to get around! You can navigate the map by:\n• Clicking and dragging to pan\n• Using arrow keys to move\n• Scrolling with your mouse wheel to zoom in and out'
      },
      {
        title: 'Neighborhoods & Progress',
        text: 'See those colorful circles? Green neighborhoods are unlocked and ready to explore. Gray ones are locked until you complete previous modules. Click on any unlocked neighborhood to start learning!'
      },
      {
        title: 'Ready to Begin?',
        text: 'You\'re all set! Click on the first neighborhood to start your learning journey. If you need help again, just click the Tutorial button in the top right. Good luck!'
      }
    ];

    if (this.tutorialStep >= tutorialSteps.length) {
      this.tutorialActive = false;
      return;
    }

    const step = tutorialSteps[this.tutorialStep];
    const boxWidth = 450;
    const boxHeight = 200;
    const characterSize = 100;
    const padding = 20;

    const container = this.add.container(
      padding + boxWidth / 2,
      this.cameras.main.height - padding - boxHeight / 2
    );
    container.setScrollFactor(0);
    container.setDepth(2000);

    // Semi-transparent overlay
    const overlay = this.add.rectangle(
      this.cameras.main.width / 2 - (padding + boxWidth / 2),
      (this.cameras.main.height - padding - boxHeight / 2) - this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
      0.5
    );
    overlay.setOrigin(0.5);

    // Box background
    const box = this.add.rectangle(0, 0, boxWidth, boxHeight, 0xffffff);
    box.setStrokeStyle(4, 0x4CAF50);

    // Character positioned to the left of the box
    const charX = -boxWidth / 2 - characterSize / 2 - 20;
    const charY = 0;
    
    // Character circle background
    const characterCircle = this.add.circle(charX, charY, characterSize / 2, 0x4CAF50);
    
    // Character face - simple friendly design
    const faceGraphics = this.add.graphics();
    
    // Eyes
    faceGraphics.fillStyle(0xffffff, 1);
    faceGraphics.fillCircle(charX - 15, charY - 10, 10);
    faceGraphics.fillCircle(charX + 15, charY - 10, 10);
    
    // Pupils
    faceGraphics.fillStyle(0x000000, 1);
    faceGraphics.fillCircle(charX - 15, charY - 10, 5);
    faceGraphics.fillCircle(charX + 15, charY - 10, 5);
    
    // Smile
    faceGraphics.lineStyle(4, 0xffffff, 1);
    faceGraphics.beginPath();
    faceGraphics.arc(charX, charY + 5, 25, Phaser.Math.DegToRad(30), Phaser.Math.DegToRad(150), false);
    faceGraphics.strokePath();
    
    // Character name badge below
    const nameBg = this.add.rectangle(charX, charY + characterSize / 2 + 20, 80, 25, 0xffffff);
    nameBg.setStrokeStyle(2, 0x4CAF50);
    
    const characterName = this.add.text(charX, charY + characterSize / 2 + 20, 'Nesty', {
      fontSize: '14px',
      color: '#4CAF50',
      fontStyle: 'bold'
    });
    characterName.setOrigin(0.5);

    // Speech bubble pointer (triangle pointing to character)
    const bubblePointer = this.add.triangle(
      -boxWidth / 2 - 10,
      0,
      0, 0,
      -15, -12,
      -15, 12,
      0xffffff
    );
    bubblePointer.setStrokeStyle(2, 0x4CAF50);

    // Title
    const title = this.add.text(-boxWidth / 2 + 20, -60, step.title, {
      fontSize: '18px',
      color: '#000000',
      fontStyle: 'bold',
      align: 'left',
      wordWrap: { width: boxWidth - 40 }
    });
    title.setOrigin(0, 0.5);

    // Text content
    const text = this.add.text(-boxWidth / 2 + 20, -10, step.text, {
      fontSize: '14px',
      color: '#333333',
      align: 'left',
      wordWrap: { width: boxWidth - 40 },
      lineSpacing: 4
    });
    text.setOrigin(0, 0.5);

    // Next button
    const buttonWidth = 100;
    const buttonHeight = 32;
    const nextButton = this.add.rectangle(boxWidth / 2 - 60, boxHeight / 2 - 25, buttonWidth, buttonHeight, 0x4CAF50);
    nextButton.setInteractive({ useHandCursor: true });

    const nextText = this.add.text(boxWidth / 2 - 60, boxHeight / 2 - 25, 
      this.tutorialStep < tutorialSteps.length - 1 ? 'Next' : 'Got it!', 
      {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    nextText.setOrigin(0.5);

    // Hover effects
    nextButton.on('pointerover', () => {
      nextButton.setFillStyle(0x45a049);
    });

    nextButton.on('pointerout', () => {
      nextButton.setFillStyle(0x4CAF50);
    });

    nextButton.on('pointerdown', () => {
      this.tutorialStep++;
      this.showTutorialStep();
    });

    // Step indicator
    const stepIndicator = this.add.text(-boxWidth / 2 + 20, boxHeight / 2 - 25, 
      `Step ${this.tutorialStep + 1} of ${tutorialSteps.length}`, 
      {
        fontSize: '12px',
        color: '#666666'
      }
    );
    stepIndicator.setOrigin(0, 0.5);

    container.add([
      overlay, 
      characterCircle, 
      faceGraphics, 
      nameBg,
      characterName, 
      box, 
      bubblePointer,
      title, 
      text, 
      nextButton, 
      nextText, 
      stepIndicator
    ]);
    this.tutorialBox = container;
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