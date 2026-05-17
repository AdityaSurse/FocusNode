export const api = {
  token: localStorage.getItem('pomo_token'),
  
  async request(path: string, options: RequestInit = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
      ...(options.headers || {}),
    };

    const res = await fetch(path, { ...options, headers });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Request failed');
    }
    return res.json();
  },

  async sync(syncKey?: string, isNew: boolean = false) {
    const data = await this.request('/api/auth/sync', {
      method: 'POST',
      body: JSON.stringify({ syncKey, isNew }),
    });
    this.token = data.token;
    localStorage.setItem('pomo_token', data.token);
    localStorage.setItem('pomo_sync_key', data.user.syncKey);
    return data.user;
  },

  async saveSession(sessionType: string, durationMinutes: number) {
    return this.request('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ sessionType, durationMinutes }),
    });
  },

  async getSessions() {
    return this.request('/api/sessions');
  },

  async clearSessions() {
    return this.request('/api/sessions', { method: 'DELETE' });
  },

  async getInsights() {
    return this.request('/api/ai/insights', { method: 'POST' });
  },

  logout() {
    this.token = null;
    localStorage.removeItem('pomo_token');
    localStorage.removeItem('pomo_sync_key');
  }
};
