// src/services/ProgressAPI.ts
export class ProgressAPI {
  // GET /api/dashboard/overview
  static async getDashboardOverview() {
    const response = await AuthService.fetchWithAuth(`${API_BASE}/dashboard/overview`);
    return response.json();
  }

  // GET /api/dashboard/modules
  static async getUserModuleProgress() {
    const response = await AuthService.fetchWithAuth(`${API_BASE}/dashboard/modules`);
    return response.json();
  }
}