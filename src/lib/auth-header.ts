
/**
 * Returns authorization headers with JWT token for API requests
 */

let authToken: string | null = null;

export const setToken = (token: string) => {
  authToken = token;
};

export const removeToken = () => {
  authToken = null;
};

export const authHeader = (): Record<string, string> => {
  if (authToken) {
    return {
      Authorization: `Bearer ${authToken}`
    };
  }
  return {};
};

export const fetchWithAuth = async <T>(url: string, options: RequestInit = {}): Promise<{ 
  success: boolean; 
  data?: T; 
  error?: string; 
}> => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...authHeader(),
      ...(options.headers || {})
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Request failed: ${errorText}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { 
      success: false, 
      error: error?.message || 'An unknown error occurred' 
    };
  }
};
