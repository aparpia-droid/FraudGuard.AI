// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// API Endpoints
export const API_ENDPOINTS = {
  // Add your API endpoints here
  // Example:
  // sessions: `${API_BASE_URL}/api/sessions`,
  // scenarios: `${API_BASE_URL}/api/scenarios`,
  // results: `${API_BASE_URL}/api/results`,
};

// Helper function for making API calls
export const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Call Error:', error);
    throw error;
  }
};
