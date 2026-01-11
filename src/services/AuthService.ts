const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export class AuthService {
  private static token: string | null = null;
  private static refreshToken: string | null = null;

  static setTokens(accessToken: string, refreshToken: string) {
    this.token = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  static getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('access_token');
    }
    return this.token;
  }

  static getRefreshToken(): string | null {
    if (!this.refreshToken) {
      this.refreshToken = localStorage.getItem('refresh_token');
    }
    return this.refreshToken;
  }

  static clearTokens() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  static async refreshAccessToken(): Promise<string> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/refresh?refresh_token=${refreshToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      if (!data.access_token || !data.refresh_token) {
        throw new Error('Invalid token refresh response');
      }
      
      this.setTokens(data.access_token, data.refresh_token);
      return data.access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      window.location.href = '/auth/login';
      throw error;
    }
  }

  static async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    let token = this.getToken();
    
    if (!token) {
      console.error('No authentication token found');
      window.location.href = '/auth/login';
      throw new Error('No authentication token found');
    }

    const makeRequest = async (authToken: string): Promise<Response> => {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        ...options.headers,
      };

      const response = await fetch(url, {
        ...options,
        headers,
      });

      return response;
    };

    try {
      let response = await makeRequest(token);

      // If unauthorized, try refreshing token
      if (response.status === 401) {
        console.log('Token expired, attempting refresh...');
        
        try {
          const newToken = await this.refreshAccessToken();
          response = await makeRequest(newToken);
        } catch (refreshError) {
          console.error('Token refresh failed, redirecting to login');
          throw new Error('Authentication failed - please log in again');
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      console.error(`Request error for ${url}:`, error);
      throw error;
    }
  }
}