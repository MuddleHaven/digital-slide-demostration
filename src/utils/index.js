// debounce function
export const debounce = (func, wait, immediate) => {
  let timeout;
  return function () {
    const context = this;
    const args = arguments;
    if (timeout) clearTimeout(timeout);
    if (immediate) {
      const callNow = !timeout;
      timeout = setTimeout(() => {
        timeout = null;
      }, wait);
      if (callNow) func.apply(context, args);
    } else {
      timeout = setTimeout(() => {
        func.apply(context, args);
      }, wait);
    }
  };
}

// throttle function
export const throttle = (func, wait) => {
  let timeout;
  return function () {
    const context = this;
    const args = arguments;
    if (!timeout) {
      timeout = setTimeout(() => {
        timeout = null;
        func.apply(context, args);
      }, wait);
    }
  };
}

/**
 * Get image prefix
 * @returns {string} imagePrefix
 */
export const getImagePrefix = (isQuality = false) => {
  const baseUrl = isQuality ? import.meta.env.VITE_QUALITY_BASE_URL : import.meta.env.VITE_BASE_URL;
  return `${baseUrl}/app_data`;
}

/**
 * Get tile url
 * @param {string} tileUrl 
 * @returns {string} tileUrl
 */
export const getTileUrl = (tileUrl) => {
  if (tileUrl && !tileUrl.startsWith('http')) {
    // Assuming same base URL logic as thumbnail if needed
    tileUrl = `${import.meta.env.VITE_BASE_URL}/app_data${tileUrl}`;
  }
  return tileUrl;
}

/**
 * Clear local storage
 */
export function clearLocalStorage() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('qualityToken');
  localStorage.removeItem('qualityRole');

  localStorage.clear();
}