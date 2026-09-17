export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(endpoint, config);

  if (!response.ok) {
    let errorMessage = 'Something went wrong';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // JSON parsing failed, use status text
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T = any>(url: string, date?: string) => {
    const finalUrl = date ? `${url}?date=${date}` : url;
    return apiRequest<T>(finalUrl, { method: 'GET' });
  },
  post: <T = any>(url: string, data: any) => {
    return apiRequest<T>(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  put: <T = any>(url: string, data: any) => {
    return apiRequest<T>(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  delete: <T = any>(url: string) => {
    return apiRequest<T>(url, { method: 'DELETE' });
  },
  deleteWithBody: <T = any>(url: string, data: any) => {
    return apiRequest<T>(url, {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  },
};
