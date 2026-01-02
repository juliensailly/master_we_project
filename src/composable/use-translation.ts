import { ref } from 'vue'
import type { Ref } from 'vue'

export interface TranslationResult {
  translatedText: string
  detectedLanguage?: string
}

export interface UseTranslationReturn {
  translate: (text: string, targetLang: string, sourceLang?: string) => Promise<void>
  translatedText: Ref<string>
  isTranslating: Ref<boolean>
  error: Ref<string | null>
  reset: () => void
}

const SUPPORTED_LANGUAGES = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese (Simplified)',
  ar: 'Arabic',
  hi: 'Hindi',
  nl: 'Dutch',
  pl: 'Polish',
  tr: 'Turkish',
  vi: 'Vietnamese',
} as const

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES

export function getSupportedLanguages(): Record<SupportedLanguage, string> {
  return SUPPORTED_LANGUAGES
}

/**
 * Composable for translating text using Google Translate API
 *
 * @example
 * const { translate, translatedText, isTranslating, error } = useTranslation()
 * await translate('Hello world', 'fr')
 */
export function useTranslation(): UseTranslationReturn {
  const translatedText = ref<string>('')
  const isTranslating = ref<boolean>(false)
  const error = ref<string | null>(null)

  /**
   * Translate text using Google Translate API
   * Using the unofficial free API endpoint
   * For production, consider using official Google Cloud Translation API with API key
   */
  async function translate(
    text: string,
    targetLang: string,
    sourceLang: string = 'auto',
  ): Promise<void> {
    if (!text.trim()) {
      error.value = 'Text cannot be empty'
      return
    }

    isTranslating.value = true
    error.value = null
    translatedText.value = ''

    try {
      // Using MyMemory Translation API (free, no API key required, CORS-enabled)
      // Limit: 10,000 words/day for anonymous usage
      // For production: consider using Google Cloud Translation API with key from config

      // Split text into chunks if too long (MyMemory has a 500 character limit per request)
      const maxChunkLength = 500
      const chunks: string[] = []

      if (text.length > maxChunkLength) {
        // Split by sentences or paragraphs
        const sentences = text.split(/([.!?]\s+)/)
        let currentChunk = ''

        for (const sentence of sentences) {
          if ((currentChunk + sentence).length <= maxChunkLength) {
            currentChunk += sentence
          }
          else {
            if (currentChunk)
              chunks.push(currentChunk)
            currentChunk = sentence
          }
        }
        if (currentChunk)
          chunks.push(currentChunk)
      }
      else {
        chunks.push(text)
      }

      // Translate all chunks
      const translatedChunks: string[] = []

      for (const chunk of chunks) {
        const apiUrl = 'https://api.mymemory.translated.net/get'

        // MyMemory API doesn't support 'auto' - if auto is specified, just send the text
        // and let the API detect the language by not specifying source language explicitly
        // Use empty string for source to let API auto-detect
        const langPair = sourceLang === 'auto' ? `en|${targetLang}` : `${sourceLang}|${targetLang}`

        const params = new URLSearchParams({
          q: chunk,
          langpair: langPair,
        })

        const response = await fetch(`${apiUrl}?${params.toString()}`, {
          method: 'GET',
        })

        if (!response.ok) {
          throw new Error(`Translation failed with status: ${response.status}`)
        }

        const data = await response.json() as {
          responseData?: { translatedText?: string }
          responseStatus?: number
        }

        if (data.responseData?.translatedText) {
          translatedChunks.push(data.responseData.translatedText)
        }
        else if (data.responseStatus === 403) {
          throw new Error('Translation quota exceeded. Please try again later.')
        }
        else {
          throw new Error('Invalid response format from translation service')
        }
      }

      translatedText.value = translatedChunks.join('')
    }
    catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'Translation failed'
      console.error('Translation error:', error_)
    }
    finally {
      isTranslating.value = false
    }
  }

  function reset(): void {
    translatedText.value = ''
    error.value = null
    isTranslating.value = false
  }

  return {
    translate,
    translatedText,
    isTranslating,
    error,
    reset,
  }
}
