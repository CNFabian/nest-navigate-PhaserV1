// src/services/ModulesAPI.ts
import { AuthService } from './AuthService';

const API_BASE = 'https://your-backend.com/api';

export class ModulesAPI {
  // GET /api/learning/modules
  static async getModules() {
    const response = await AuthService.fetchWithAuth(`${API_BASE}/learning/modules`);
    return response.json();
  }

  // GET /api/learning/modules/{module_id}/lessons
  static async getModuleLessons(moduleId: string) {
    const response = await AuthService.fetchWithAuth(
      `${API_BASE}/learning/modules/${moduleId}/lessons`
    );
    return response.json();
  }

  // POST /api/learning/lessons/{lesson_id}/complete
  static async completeLesson(lessonId: string) {
    const response = await AuthService.fetchWithAuth(
      `${API_BASE}/learning/lessons/${lessonId}/complete`,
      { method: 'POST' }
    );
    return response.json();
  }
}