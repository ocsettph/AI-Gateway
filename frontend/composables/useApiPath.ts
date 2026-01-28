/**
 * Helper function to build API paths correctly
 * Handles both production (/api) and development (http://localhost:4000) cases
 */
export function useApiPath(apiBase: string, endpoint: string): string {
  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  
  // Check if apiBase already includes /api prefix
  if (apiBase.endsWith('/api') || apiBase === '/api') {
    // Production: apiBase = '/api', endpoint = 'me' -> '/api/me'
    return `${apiBase}/${cleanEndpoint}`
  } else {
    // Development: apiBase = 'http://localhost:4000', endpoint = 'me' -> 'http://localhost:4000/api/me'
    return `${apiBase}/api/${cleanEndpoint}`
  }
}

