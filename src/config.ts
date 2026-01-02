export const CONFIG = {
  API_HOST: String(import.meta.env.VITE_API_HOST) || '',
  GOOGLE_TRANSLATE_API_KEY: String(import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY || ''),
}
