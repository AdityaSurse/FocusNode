export const api = {
  token: localStorage.getItem('pomo_token'),
  
  async request(path: string, options: RequestInit = {}) {
    this.token = localStorage.getItem('pomo_token');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('pomo_token');
    if (token && typeof token === 'string' && token.length > 20) {
      const cleanToken = token.trim().replace(/[\r\n]/g, '');
      // Only set if ASCII to prevent browser fetch error "The string did not match the expected pattern"
      if (/^[\x00-\x7F]*$/.test(cleanToken)) {
        headers['Authorization'] = `Bearer ${cleanToken}`;
      } else {
        console.warn('[API] Non-ASCII token detected. Character codes:', [...cleanToken].map(c => c.charCodeAt(0)));
      }
    }

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    let fullPath = path;
    if (!path.startsWith('http')) {
      const origin = (typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null') 
        ? window.location.origin 
        : '';
      fullPath = `${origin}${path}`;
    }

    try {
      const res = await fetch(fullPath, { ...options, headers });
      const contentType = res.headers.get('content-type');
      
      if (!res.ok) {
        if (contentType && contentType.includes('application/json')) {
          const err = await res.json();
          throw new Error(err.error || `Error ${res.status}`);
        } else {
          const text = await res.text();
          console.error('[API] Non-JSON error:', text.slice(0, 500));
          throw new Error(`Server Error: ${res.status}`);
        }
      }

      if (contentType && contentType.includes('application/json')) {
        return res.json();
      }
      
      return res.text();
    } catch (e: any) {
      console.error(`[API] Fetch Error for ${path}:`, e.message);
      throw e;
    }
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
