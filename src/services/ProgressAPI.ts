import { AuthService } from './AuthService';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export class ProgressAPI {
  // GET /api/dashboard/overview
  static async getDashboardOverview() {
    const response = await AuthService.fetchWithAuth(`${API_BASE}/api/dashboard/overview`);
    return response.json();
  }

  // GET /api/dashboard/modules
  static async getUserModuleProgress() {
    const response = await AuthService.fetchWithAuth(`${API_BASE}/api/dashboard/modules`);
    return response.json();
  }
}