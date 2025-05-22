
// Authentication header helpers

// Key for storing the auth token
const TOKEN_KEY = 'airq-auth-token';

// Get auth headers for API requests
export const authHeader = (): Record<string, string> => {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Set auth token in local storage
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

// Remove auth token from local storage
export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// Helper function for authenticated fetch
export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const headers = {
    ...options.headers,
    ...authHeader(),
  };

  return fetch(url, {
    ...options,
    headers,
  });
};
