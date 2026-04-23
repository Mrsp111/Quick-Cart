const SESSION_KEY = 'quickcart_session';

export const sessionManager = {
  setSession(userData) {
    const session = {
      user: userData.user,
      token: userData.token,
      timestamp: new Date().getTime()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  },

  getSession() {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  },

  clearSession() {
    localStorage.removeItem(SESSION_KEY);
  },

  isAuthenticated() {
    return !!this.getSession();
  }
};