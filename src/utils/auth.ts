const AUTH_KEY = 'review_admin_auth';
const FIXED_CREDENTIALS = {
  mobile: '9426479677',
  password: 'yash123'
};

export const auth = {
  login(mobile: string, password: string): boolean {
    if (mobile === FIXED_CREDENTIALS.mobile && password === FIXED_CREDENTIALS.password) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      return true;
    }
    return false;
  },

  logout(): void {
    sessionStorage.removeItem(AUTH_KEY);
  },

  isAuthenticated(): boolean {
    return sessionStorage.getItem(AUTH_KEY) === 'true';
  }
};