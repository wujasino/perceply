type AuthUser = {
  email: string;
  name?: string;
  provider?: 'local' | 'google';
};

const AUTH_KEY = 'authUser';

export function setAuthUser(user: AuthUser) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function getAuthUser(): AuthUser | null {
  const v = localStorage.getItem(AUTH_KEY);
  if (!v) return null;
  try {
    return JSON.parse(v) as AuthUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getAuthUser() !== null;
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
}

export default { setAuthUser, getAuthUser, isAuthenticated, logout };
