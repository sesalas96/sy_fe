const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export async function apiCall(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  endpoint: string,
  data?: any,
  options?: RequestInit
): Promise<any> {
  const token = localStorage.getItem('token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options?.headers || {})
  };

  const config: RequestInit = {
    method,
    headers,
    ...options
  };

  if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    let errorData: any = null;
    
    try {
      errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // If response is not JSON, use default error message
    }
    
    // Create custom error with status code
    const error: any = new Error(errorMessage);
    error.status = response.status;
    error.statusText = response.statusText;
    error.data = errorData;
    throw error;
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return null;
  }

  return response.json();
}