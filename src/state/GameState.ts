import { ModulesAPI } from '../services/ModulesAPI';
import { ProgressAPI } from '../services/ProgressAPI';

export class GameState {
  private static instance: GameState;
  
  public coins: number = 0;
  public modules: any[] = [];
  public userProgress: any = null;
  public currentUser: any = null;

  static getInstance(): GameState {
    if (!GameState.instance) {
      GameState.instance = new GameState();
    }
    return GameState.instance;
  }

  async loadUserData() {
    const overview = await ProgressAPI.getDashboardOverview();
    this.coins = overview.total_coins;
    this.currentUser = overview;
  }

  async loadModules() {
    this.modules = await ModulesAPI.getModules();
  }
}