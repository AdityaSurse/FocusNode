export const api = {
  token: localStorage.getItem('pomo_token'),
  
  async request(path: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as any || {}),
    };

    if (this.token && typeof this.token === 'string' && this.token.length > 10) {
      // Validate that the token is ASCII to avoid "The string did not match the expected pattern"
      // which happens at the browser's fetch level if non-ASCII is in headers.
      if (/^[\x00-\x7F]*$/.test(this.token)) {
        headers['Authorization'] = `Bearer ${this.token}`;
      } else {
        console.error('Invalid token characters detected, clearing token');
        this.logout();
      }
    }

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
