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
      // Using Google Translate's unofficial API
      // For production: use official Google Cloud Translation API with key from config
      const apiUrl = 'https://translate.googleapis.com/translate_a/single'
      const params = new URLSearchParams({
        client: 'gtx',
        sl: sourceLang,
        tl: targetLang,
        dt: 't',
        q: text,
      })

      const response = await fetch(`${apiUrl}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Translation failed with status: ${response.status}`)
      }

      const data = await response.json() as unknown

      // Parse Google Translate response format
      // Response is an array where first element contains translation segments
      if (Array.isArray(data) && data[0] && Array.isArray(data[0])) {
        const translatedSegments = data[0]
          .map((segment: unknown[]) => {
            if (Array.isArray(segment) && typeof segment[0] === 'string') {
              return segment[0]
            }
            return null
          })
          .filter((text): text is string => text !== null)
          .join('')

        translatedText.value = translatedSegments
      }
      else {
        throw new Error('Invalid response format from translation service')
      }
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
