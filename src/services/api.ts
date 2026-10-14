/**
 * API Service Layer
 * 
 * This service handles all HTTP requests to the backend API.
 * It automatically includes the Keycloak JWT token in all requests.
 * 
 * Similar to RestTemplate with OAuth2RestTemplate in Spring Boot:
 * - Centralized HTTP client
 * - Automatic token injection
 * - Error handling
 * - Request/response logging
 * 
 * @module services/api
 */

import { getToken } from './keycloak';

/**
 * Base API URL
 * In development, this uses Vite proxy to avoid CORS issues
 * In production, update this to your backend URL
 */
const API_BASE_URL = '/api';

/**
 * API Request Options
 * Extends standard RequestInit to allow custom headers
 */
interface ApiRequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

/**
 * Generic API Request Function
 * 
 * Makes HTTP requests to the backend with automatic token injection.
 * Similar to @Autowired RestTemplate in Spring Boot.
 * 
 * Features:
 * - Automatic JWT token injection in Authorization header
 * - Conditional Content-Type header (only for POST/PUT/PATCH)
 * - Error handling and logging
 * - Generic type support for type-safe responses
 * 
 * Flow:
 * 1. Get current access token from Keycloak
 * 2. Determine HTTP method (default: GET)
 * 3. Add Content-Type only for methods that need it
 * 4. Add Authorization header if token exists
 * 5. Make request to backend
 * 6. Handle errors (especially 401 Unauthorized)
 * 7. Parse and return JSON response
 * 
 * @param endpoint - API endpoint path (e.g., '/users', '/collections')
 * @param options - Fetch options (method, body, headers, etc.)
 * @returns Promise with typed response data
 * 
 * @example
 * // GET request
 * const users = await apiRequest<User[]>('/users');
 * 
 * @example
 * // POST request
 * const newUser = await apiRequest<User>('/users', {
 *   method: 'POST',
 *   body: JSON.stringify({ name: 'John' })
 * });
 */
export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  /**
   * Determine HTTP Method
   * Default to GET if not specified
   */
  const method = options.method || 'GET';
  
  /**
   * Conditional Content-Type
   * 
   * Only add Content-Type header for methods that send data.
   * GET requests don't need Content-Type, and adding it triggers
   * a CORS preflight (OPTIONS) request.
   * 
   * This is similar to Spring's @RequestBody annotation -
   * only used when sending data to the server.
   */
  const needsContentType = ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase());
  
  /**
   * Get Current Access Token
   * 
   * This is similar to Spring Security's SecurityContextHolder:
   * SecurityContextHolder.getContext().getAuthentication().getCredentials()
   */
  const token = getToken();
  console.log('API Request:', { url, method, hasToken: !!token });

  /**
   * Build Request Configuration
   * 
   * Merge options with:
   * - Content-Type (conditional)
   * - Authorization header (if token exists)
   * - User-provided headers
   */
  const config: RequestInit = {
    ...options,
    method,
    headers: {
      // Add Content-Type only for POST/PUT/PATCH
      ...(needsContentType && { 'Content-Type': 'application/json' }),
      // Add Authorization header if token exists
      ...(token && { 'Authorization': `Bearer ${token}` }),
      // Merge user-provided headers
      ...options.headers,
    },
  };

  console.log('API Request headers:', config.headers);

  /**
   * Make HTTP Request
   * Similar to restTemplate.exchange() in Spring Boot
   */
  const response = await fetch(url, config);
  
  console.log('API Response:', { url, status: response.status, statusText: response.statusText });

  /**
   * Error Handling
   * 
   * Handle HTTP errors, especially 401 Unauthorized
   * which means the token is invalid or expired.
   * 
   * Similar to @ExceptionHandler in Spring Boot
   */
  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error response:', errorText);
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  /**
   * Parse and Return Response
   * 
   * Automatically parses JSON response and returns typed data.
   * Similar to @ResponseBody in Spring Boot.
   */
  const data = await response.json();
  console.log('API Response data:', data);
  return data;
}

/**
 * Usage Examples
 * 
 * GET Request:
 * ```typescript
 * const collections = await apiRequest<Collection[]>('/collections');
 * ```
 * 
 * POST Request:
 * ```typescript
 * const newCollection = await apiRequest<Collection>('/collections', {
 *   method: 'POST',
 *   body: JSON.stringify({ name: 'My Collection' })
 * });
 * ```
 * 
 * DELETE Request:
 * ```typescript
 * await apiRequest<void>('/collections/123', {
 *   method: 'DELETE'
 * });
 * ```
 */
