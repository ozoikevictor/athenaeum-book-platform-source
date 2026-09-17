const DEFAULT_API_BASE_URL = import.meta.env.DEV
  ? "http://localhost:5000/api"
  : "https://athenaeum-book-platform-source.onrender.com/api";
const API_BASE_URL = import.meta.env.VITE_API_URL ?? DEFAULT_API_BASE_URL;
const REQUEST_TIMEOUT_MS = 60000;

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  timeoutMs?: number;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("athenaeum-token") : null;
  const controller = new AbortController();
  const { timeoutMs = REQUEST_TIMEOUT_MS, ...requestOptions } = options;
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...requestOptions,
      headers,
      signal: controller.signal,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message ?? "Request failed");
    }

    return data as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("The backend is still waking up. Wait a moment, then try again. Render free hosting can sleep when nobody is using the app.");
    }
    if (error instanceof TypeError) {
      throw new Error(`The backend could not be reached. API URL: ${API_BASE_URL}. Check that Vercel has the correct VITE_API_URL and that Render is running.`);
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function downloadApiFile(path: string, filename: string) {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("athenaeum-token") : null;
  const headers = new Headers();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { headers });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message ?? "Download failed");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export type AuthResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

export function loginUser(email: string, password: string) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
    timeoutMs: 120000,
  });
}

export function registerUser(input: { name: string; email: string; password: string; favoriteGenres: string[] }) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: input,
    timeoutMs: 120000,
  });
}

export type ApiBook = {
  id: string;
  mongoId?: string;
  title: string;
  author: string;
  genre: string;
  rating: number;
  year: number;
  pages: number;
  description: string;
  reason: string;
  tags: string[];
  cover: string;
  status?: "Want to Read" | "Currently Reading" | "Finished";
  progress?: number;
  userRating?: number;
  likeCount?: number;
  commentCount?: number;
  likedByUser?: boolean;
};

export type ReadingListItem = {
  id: string;
  bookId: string;
  status: "Want to Read" | "Currently Reading" | "Finished";
  progress: number;
  book: ApiBook;
};

export type DashboardResponse = {
  stats: {
    booksRead: number;
    averageRating: number;
    currentlyReading: number;
    pagesThisWeek: number;
  };
  activity: Array<{ id: string; label: string; pages: number }>;
  genreMix: Array<{ genre: string; percent: number }>;
  readingList: ReadingListItem[];
  recommendations: ApiBook[];
};

export type BookComment = {
  id: string;
  text: string;
  status: string;
  user: string;
  createdAt: string;
};

export type AdminEngagementResponse = {
  comments: Array<{ id: string; type: "Comment"; book: string; user: string; text: string; status: string; createdAt: string }>;
  ratings: Array<{ id: string; type: "Rating"; book: string; user: string; rating: number; status: string; createdAt: string }>;
  likes: Array<{ id: string; type: "Like"; book: string; user: string; status: string; createdAt: string }>;
};

export type AdminOverviewResponse = {
  stats: {
    totalUsers: number;
    totalBooks: number;
    totalReviews: number;
    totalLikes: number;
    pendingComments: number;
    activeRecommendations: number;
  };
  recentActivity: Array<{ id: string; label: string; createdAt: string }>;
  topGenres: Array<{ genre: string; count: number; percent: number }>;
  recommendationHealth: number;
};

export type AdminBookRow = Pick<ApiBook, "id" | "title" | "author" | "genre" | "rating" | "year" | "cover"> & {
  likes: number;
  comments: number;
};

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  books: number;
  comments: number;
  ratings: number;
  likes: number;
  status: string;
  createdAt?: string;
};

export type AdminSavedBookRow = {
  id: string;
  status: "Want to Read" | "Currently Reading" | "Finished";
  progress: number;
  savedAt: string;
  reader: { id: string; name: string; email: string; role: string; status: string } | null;
  book: Pick<ApiBook, "id" | "title" | "author" | "genre" | "cover" | "year"> | null;
};

export function getDashboard() {
  return apiRequest<DashboardResponse>("/users/me/dashboard");
}

export function downloadReportPdf() {
  return downloadApiFile("/users/me/report.pdf", "athenaeum-reading-report.pdf");
}

export function exportAccountData() {
  return apiRequest<unknown>("/users/me/export");
}

export function deleteMyAccount() {
  return apiRequest<{ message: string }>("/users/me", { method: "DELETE" });
}

export function changeMyPassword(input: { currentPassword: string; newPassword: string }) {
  return apiRequest<{ message: string }>("/users/me/change-password", {
    method: "POST",
    body: input,
  });
}

export function getBooks(params: { search?: string; genre?: string; sort?: string } = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const query = search.toString();
  return apiRequest<{ books: ApiBook[]; count: number }>(`/books${query ? `?${query}` : ""}`);
}

export function getGenres() {
  return apiRequest<{ genres: string[] }>("/books/genres");
}

export function getBook(bookId: string) {
  return apiRequest<{ book: ApiBook }>(`/books/${bookId}`);
}

export function saveBook(bookId: string, input: { status?: string; progress?: number } = {}) {
  return apiRequest<{ message: string; readingListItem: ReadingListItem }>(`/books/${bookId}/save`, {
    method: "POST",
    body: input,
  });
}

export function rateBook(bookId: string, rating: number) {
  return apiRequest<{ message: string; book: ApiBook }>(`/books/${bookId}/rate`, {
    method: "POST",
    body: { rating },
  });
}

export function toggleBookLike(bookId: string) {
  return apiRequest<{ message: string; liked: boolean; likeCount: number }>(`/books/${bookId}/like`, {
    method: "POST",
  });
}

export function getBookComments(bookId: string) {
  return apiRequest<{ comments: BookComment[] }>(`/books/${bookId}/comments`);
}

export function createBookComment(bookId: string, text: string) {
  return apiRequest<{ message: string; comment: BookComment }>(`/books/${bookId}/comments`, {
    method: "POST",
    body: { text },
  });
}

export function getAdminEngagement() {
  return apiRequest<AdminEngagementResponse>("/admin/reviews");
}

export function getAdminOverview() {
  return apiRequest<AdminOverviewResponse>("/admin/overview");
}

export function getAdminBooks() {
  return apiRequest<{ books: AdminBookRow[] }>("/admin/books");
}

export function deleteAdminBook(id: string) {
  return apiRequest<{ message: string }>(`/books/${id}`, { method: "DELETE" });
}

export function getAdminUsers() {
  return apiRequest<{ users: AdminUserRow[] }>("/admin/users");
}

export function getAdminSavedBooks() {
  return apiRequest<{ savedBooks: AdminSavedBookRow[] }>("/admin/saved-books");
}

export function deactivateAdminUser(id: string) {
  return apiRequest<{ message: string; user: AdminUserRow }>(`/admin/users/${id}/deactivate`, { method: "PATCH" });
}

export function deleteAdminUser(id: string) {
  return apiRequest<{ message: string }>(`/admin/users/${id}`, { method: "DELETE" });
}

export function approveAdminComment(id: string) {
  return apiRequest<{ message: string }>(`/admin/reviews/${id}/approve`, { method: "PATCH" });
}

export function hideAdminComment(id: string) {
  return apiRequest<{ message: string }>(`/admin/reviews/${id}/hide`, { method: "PATCH" });
}

export function deleteAdminComment(id: string) {
  return apiRequest<{ message: string }>(`/admin/reviews/${id}`, { method: "DELETE" });
}

export function getReadingList(status = "All") {
  return apiRequest<{ readingList: ReadingListItem[] }>(`/users/me/reading-list?status=${encodeURIComponent(status)}`);
}

export function updateReadingListItem(id: string, input: { status?: string; progress?: number }) {
  return apiRequest<{ message: string; readingListItem: ReadingListItem }>(`/users/me/reading-list/${id}`, {
    method: "PATCH",
    body: input,
  });
}

export function removeReadingListItem(id: string) {
  return apiRequest<{ message: string }>(`/users/me/reading-list/${id}`, {
    method: "DELETE",
  });
}

export function createBook(input: Partial<ApiBook>) {
  return apiRequest<{ message: string; book: ApiBook }>("/books", {
    method: "POST",
    body: input,
  });
}

export function updateBook(id: string, input: Partial<ApiBook>) {
  return apiRequest<{ message: string; book: ApiBook }>(`/books/${id}`, {
    method: "PUT",
    body: input,
  });
}
