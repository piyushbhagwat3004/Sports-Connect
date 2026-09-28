//for creating instance

// Example: create an axios instance (customize as needed)
const { default: axios} = require("axios")

export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:9000";

export const clientServer = axios.create({
  baseURL: BASE_URL,
});

// Auto-inject x-auth-token header if token is in localStorage (client side)
if (typeof window !== 'undefined') {
  clientServer.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  }, error => {
    return Promise.reject(error);
  });
}

// Server-side client for SSR (getServerSideProps) inside Docker
// Falls back to localhost:9000 for local dev without Docker
export const serverClient = axios.create({
  baseURL: process.env.INTERNAL_API_URL || "http://localhost:9000",
});