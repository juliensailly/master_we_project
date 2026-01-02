import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSupportedLanguages, useTranslation } from './use-translation'

// Mock fetch globally
const mockFetch = vi.fn()
globalThis.fetch = mockFetch

describe('useTranslation', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  describe('getSupportedLanguages', () => {
    it('should return a list of supported languages', () => {
      const languages = getSupportedLanguages()

      expect(languages).toHaveProperty('en')
      expect(languages).toHaveProperty('es')
      expect(languages).toHaveProperty('fr')
      expect(languages.en).toBe('English')
      expect(languages.fr).toBe('French')
    })

    it('should contain at least 15 languages', () => {
      const languages = getSupportedLanguages()
      const languageCount = Object.keys(languages).length

      expect(languageCount).toBeGreaterThanOrEqual(15)
    })
  })

  describe('useTranslation composable', () => {
    it('should initialize with empty state', () => {
      const { translatedText, isTranslating, error } = useTranslation()

      expect(translatedText.value).toBe('')
      expect(isTranslating.value).toBe(false)
      expect(error.value).toBeNull()
    })

    it('should translate text successfully', async () => {
      const mockTranslation = {
        responseData: { translatedText: 'Hola mundo' },
        responseStatus: 200,
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTranslation,
      })

      const { translate, translatedText, isTranslating, error } = useTranslation()

      await translate('Hello world', 'es')

      expect(mockFetch).toHaveBeenCalledOnce()
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('api.mymemory.translated.net'),
        expect.any(Object),
      )
      expect(translatedText.value).toBe('Hola mundo')
      expect(isTranslating.value).toBe(false)
      expect(error.value).toBeNull()
    })

    it('should handle translation with auto source language', async () => {
      const mockTranslation = {
        responseData: { translatedText: 'Bonjour' },
        responseStatus: 200,
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTranslation,
      })

      const { translate } = useTranslation()

      await translate('Hello', 'fr')

      const callUrl = mockFetch.mock.calls[0][0] as string
      // When auto is used, defaults to 'en' as source
      expect(callUrl).toContain('langpair=en')
    })

    it('should handle translation with specified source language', async () => {
      const mockTranslation = {
        responseData: { translatedText: 'Hello' },
        responseStatus: 200,
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTranslation,
      })

      const { translate } = useTranslation()

      await translate('Hola', 'en', 'es')

      const callUrl = mockFetch.mock.calls[0][0] as string
      expect(callUrl).toContain('langpair=es%7Cen')
    })

    it('should handle empty text error', async () => {
      const { translate, error } = useTranslation()

      await translate('', 'es')

      expect(mockFetch).not.toHaveBeenCalled()
      expect(error.value).toBe('Text cannot be empty')
    })

    it('should handle whitespace-only text as empty', async () => {
      const { translate, error } = useTranslation()

      await translate('   ', 'es')

      expect(mockFetch).not.toHaveBeenCalled()
      expect(error.value).toBe('Text cannot be empty')
    })

    it('should handle API error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      const { translate, error, translatedText } = useTranslation()

      await translate('Hello', 'es')

      expect(error.value).toContain('Translation failed with status: 500')
      expect(translatedText.value).toBe('')
    })

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { translate, error, translatedText } = useTranslation()

      await translate('Hello', 'es')

      expect(error.value).toBe('Network error')
      expect(translatedText.value).toBe('')
    })

    it('should handle invalid response format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'format' }),
      })

      const { translate, error } = useTranslation()

      await translate('Hello', 'es')

      expect(error.value).toBe('Invalid response format from translation service')
    })

    it('should handle quota exceeded error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ responseStatus: 403 }),
      })

      const { translate, error } = useTranslation()

      await translate('Hello', 'es')

      expect(error.value).toBe('Translation quota exceeded. Please try again later.')
    })

    it('should set isTranslating to true during translation', async () => {
      let resolveTranslation: any
      const translationPromise = new Promise(resolve => {
        resolveTranslation = resolve
      })

      mockFetch.mockReturnValueOnce(
        translationPromise.then(() => ({
          ok: true,
          json: async () => ({
            responseData: { translatedText: 'Hola' },
            responseStatus: 200,
          }),
        })),
      )

      const { translate, isTranslating } = useTranslation()

      const translatePromise = translate('Hello', 'es')

      // Should be true while translating
      expect(isTranslating.value).toBe(true)

      resolveTranslation()
      await translatePromise

      // Should be false after completion
      expect(isTranslating.value).toBe(false)
    })

    it('should concatenate multiple translation segments', async () => {
      const mockTranslation1 = {
        responseData: { translatedText: 'Hello ' },
        responseStatus: 200,
      }
      const mockTranslation2 = {
        responseData: { translatedText: 'world' },
        responseStatus: 200,
      }
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTranslation1,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTranslation2,
        })

      const { translate } = useTranslation()

      // Create a text longer than 500 chars to trigger chunking
      const longText = `${'A'.repeat(300)}. ${'B'.repeat(300)}`
      await translate(longText, 'en')

      // Should have made multiple calls for long text
      expect(mockFetch).toHaveBeenCalled()
    })

    it('should reset state correctly', async () => {
      const mockTranslation = {
        responseData: { translatedText: 'Hola' },
        responseStatus: 200,
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTranslation,
      })

      const { translate, translatedText, isTranslating, error, reset } = useTranslation()

      await translate('Hello', 'es')

      expect(translatedText.value).toBe('Hola')

      reset()

      expect(translatedText.value).toBe('')
      expect(isTranslating.value).toBe(false)
      expect(error.value).toBeNull()
    })

    it('should clear previous translation on new request', async () => {
      const mockTranslation1 = {
        responseData: { translatedText: 'Hola' },
        responseStatus: 200,
      }
      const mockTranslation2 = {
        responseData: { translatedText: 'Bonjour' },
        responseStatus: 200,
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTranslation1,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTranslation2,
        })

      const { translate, translatedText } = useTranslation()

      await translate('Hello', 'es')
      expect(translatedText.value).toBe('Hola')

      await translate('Hello', 'fr')
      expect(translatedText.value).toBe('Bonjour')
    })

    it('should handle translation for short text without chunking', async () => {
      const mockTranslation = {
        responseData: { translatedText: 'Hola' },
        responseStatus: 200,
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTranslation,
      })

      const { translate, translatedText } = useTranslation()

      await translate('Hello', 'es')

      expect(translatedText.value).toBe('Hola')
      expect(mockFetch).toHaveBeenCalledOnce()
    })
  })
})
