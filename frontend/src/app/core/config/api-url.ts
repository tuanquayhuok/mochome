const isLocal = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_URL = isLocal 
  ? '/api' 
  : 'https://mochome-d8jk-git-main-tuanquayhuoks-projects.vercel.app/api';
