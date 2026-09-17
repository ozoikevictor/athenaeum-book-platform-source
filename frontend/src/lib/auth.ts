import { redirect } from "@tanstack/react-router";

const AUTH_KEY = "athenaeum-authenticated";
const TOKEN_KEY = "athenaeum-token";
const USER_KEY = "athenaeum-user";

function readStored(key: string) {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
}

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  role?: string;
  books?: number;
  status?: string;
  favoriteGenres?: string[];
};

export function isSignedIn() {
  // The saved browser session is unavailable during server rendering. Allow the
  // route to hydrate, then enforce the token, user, and role checks in-browser.
  if (typeof window === "undefined") return true;
  return readStored(AUTH_KEY) === "true" && Boolean(readStored(TOKEN_KEY)) && Boolean(getCurrentUser());
}

export function signIn(token?: string, user?: unknown, remember = true) {
  if (typeof window !== "undefined") {
    signOut();
    const storage = remember ? window.localStorage : window.sessionStorage;
    storage.setItem(AUTH_KEY, "true");
    if (token) {
      storage.setItem(TOKEN_KEY, token);
    }
    if (user) {
      storage.setItem(USER_KEY, JSON.stringify(user));
    }
  }
}

export function getAuthToken() {
  return readStored(TOKEN_KEY);
}

export function getCurrentUser(): StoredUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = readStored(USER_KEY);

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as StoredUser;
  } catch {
    return null;
  }
}

export function signOut() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_KEY);
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    window.sessionStorage.removeItem(AUTH_KEY);
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(USER_KEY);
  }
}

export function requireSignIn() {
  if (!isSignedIn()) {
    signOut();
    throw redirect({ to: "/login" });
  }
}

export function requireReader() {
  requireSignIn();
  if (typeof window === "undefined") return;
  if (getCurrentUser()?.role?.toLowerCase() !== "user") {
    signOut();
    throw redirect({ to: "/login" });
  }
}

export function requireAdmin() {
  requireSignIn();
  if (typeof window === "undefined") return;
  if (getCurrentUser()?.role?.toLowerCase() !== "admin") {
    signOut();
    throw redirect({ to: "/login" });
  }
}
