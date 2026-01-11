import { AuthService } from './AuthService';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export class ModulesAPI {
  // GET /api/learning/modules
  static async getModules() {
    const response = await AuthService.fetchWithAuth(`${API_BASE}/api/learning/modules`);
    return response.json();
  }

  // GET /api/learning/modules/{module_id}/lessons
  static async getModuleLessons(moduleId: string) {
    const response = await AuthService.fetchWithAuth(
      `${API_BASE}/api/learning/modules/${moduleId}/lessons`
    );
    return response.json();
  }

  // POST /api/learning/lessons/{lesson_id}/complete
  static async completeLesson(lessonId: string) {
    const response = await AuthService.fetchWithAuth(
      `${API_BASE}/api/learning/lessons/${lessonId}/complete`,
      { method: 'POST' }
    );
    return response.json();
  }
}