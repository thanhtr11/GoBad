// Disable Vite HMR in Docker environment
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  // We're not on localhost, so disable HMR to prevent WebSocket errors
  if (window.__VITE_ENV__ !== undefined) {
    window.__VITE_ENV__.HMR = false;
  }
}

// Intercept and suppress HMR client errors
const originalError = console.error;
console.error = function(...args) {
  if (args[0] && typeof args[0] === 'string' && 
      (args[0].includes('[vite] server connection lost') || 
       args[0].includes('WebSocket') ||
       args[0].includes('ERR_CONNECTION_REFUSED'))) {
    // Silently ignore these errors
    return;
  }
  originalError.apply(console, args);
};
