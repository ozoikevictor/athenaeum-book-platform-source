import { redirect } from "@tanstack/react-router";

const AUTH_KEY = "athenaeum-authenticated";
const TOKEN_KEY = "athenaeum-token";
const USER_KEY = "athenaeum-user";

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
  return window.localStorage.getItem(AUTH_KEY) === "true"
    && Boolean(window.localStorage.getItem(TOKEN_KEY))
    && Boolean(getCurrentUser());
}

export function signIn(token?: string, user?: unknown) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_KEY, "true");
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
    }
    if (user) {
      window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  }
}

export function getCurrentUser(): StoredUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(USER_KEY);

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
  if (getCurrentUser()?.role !== "User") {
    signOut();
    throw redirect({ to: "/login" });
  }
}

export function requireAdmin() {
  requireSignIn();
  if (getCurrentUser()?.role !== "Admin") {
    signOut();
    throw redirect({ to: "/login" });
  }
}
