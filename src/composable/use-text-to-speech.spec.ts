import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTextToSpeech } from './use-text-to-speech'

describe('useTextToSpeech', () => {
  let mockSpeechSynthesis: {
    speak: ReturnType<typeof vi.fn>
    cancel: ReturnType<typeof vi.fn>
    pause: ReturnType<typeof vi.fn>
    resume: ReturnType<typeof vi.fn>
    speaking: boolean
    paused: boolean
  }

  let capturedUtterance: SpeechSynthesisUtterance | null = null

  beforeEach(() => {
    capturedUtterance = null

    class MockSpeechSynthesisEvent {
      type: string
      utterance: any
      constructor(type: string, options: { utterance: any }) {
        this.type = type
        this.utterance = options.utterance
      }
    }

    class MockSpeechSynthesisErrorEvent {
      type: string
      utterance: any
      error: string
      constructor(type: string, options: { utterance: any, error: string }) {
        this.type = type
        this.utterance = options.utterance
        this.error = options.error
      }
    }

    Object.defineProperty(globalThis, 'SpeechSynthesisEvent', {
      writable: true,
      configurable: true,
      value: MockSpeechSynthesisEvent,
    })

    Object.defineProperty(globalThis, 'SpeechSynthesisErrorEvent', {
      writable: true,
      configurable: true,
      value: MockSpeechSynthesisErrorEvent,
    })

    mockSpeechSynthesis = {
      speak: vi.fn((utterance: SpeechSynthesisUtterance) => {
        capturedUtterance = utterance
        if (utterance.onstart)
          utterance.onstart(new MockSpeechSynthesisEvent('start', { utterance }) as any)
      }),
      cancel: vi.fn(() => {
        if (capturedUtterance && capturedUtterance.onend) {
          capturedUtterance.onend(new MockSpeechSynthesisEvent('end', { utterance: capturedUtterance }) as any)
        }
        capturedUtterance = null
      }),
      pause: vi.fn(() => {
        if (capturedUtterance && capturedUtterance.onpause) {
          capturedUtterance.onpause(new MockSpeechSynthesisEvent('pause', { utterance: capturedUtterance }) as any)
        }
      }),
      resume: vi.fn(() => {
        if (capturedUtterance && capturedUtterance.onresume) {
          capturedUtterance.onresume(new MockSpeechSynthesisEvent('resume', { utterance: capturedUtterance }) as any)
        }
      }),
      speaking: false,
      paused: false,
    }

    Object.defineProperty(globalThis, 'speechSynthesis', {
      writable: true,
      configurable: true,
      value: mockSpeechSynthesis,
    })

    Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', {
      writable: true,
      configurable: true,
      value: class MockSpeechSynthesisUtterance {
        text: string
        lang: string = 'en-US'
        rate: number = 1
        pitch: number = 1
        volume: number = 1
        onstart: ((event: SpeechSynthesisEvent) => void) | null = null
        onend: ((event: SpeechSynthesisEvent) => void) | null = null
        onerror: ((event: SpeechSynthesisErrorEvent) => void) | null = null
        onpause: ((event: SpeechSynthesisEvent) => void) | null = null
        onresume: ((event: SpeechSynthesisEvent) => void) | null = null

        constructor(text: string) {
          this.text = text
        }
      },
    })
  })

  describe('speak', () => {
    it('should initialize with correct default state', () => {
      const { isSpeaking, isPaused, error } = useTextToSpeech()

      expect(isSpeaking.value).toBe(false)
      expect(isPaused.value).toBe(false)
      expect(error.value).toBeNull()
    })

    it('should speak text successfully', () => {
      const { speak, isSpeaking } = useTextToSpeech()

      speak('Hello world')

      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1)
      expect(capturedUtterance?.text).toBe('Hello world')
      expect(isSpeaking.value).toBe(true)
    })

    it('should use default language when not specified', () => {
      const { speak } = useTextToSpeech()

      speak('Hello world')

      expect(capturedUtterance?.lang).toBe('en-US')
    })

    it('should use specified language', () => {
      const { speak } = useTextToSpeech()

      speak('Bonjour le monde', 'fr-FR')

      expect(capturedUtterance?.lang).toBe('fr-FR')
    })

    it('should handle empty text', () => {
      const { speak, error } = useTextToSpeech()

      speak('')

      expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled()
      expect(error.value).toBe('Text cannot be empty')
    })

    it('should handle whitespace-only text', () => {
      const { speak, error } = useTextToSpeech()

      speak('   ')

      expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled()
      expect(error.value).toBe('Text cannot be empty')
    })

    it('should stop previous speech when starting new one', () => {
      const { speak } = useTextToSpeech()

      speak('First text')
      speak('Second text')

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalledTimes(1)
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(2)
      expect(capturedUtterance?.text).toBe('Second text')
    })

    it('should update state when speech ends', () => {
      const { speak, isSpeaking } = useTextToSpeech()
      const MockSpeechSynthesisEvent = (globalThis as any).SpeechSynthesisEvent

      speak('Hello world')
      expect(isSpeaking.value).toBe(true)

      if (capturedUtterance && capturedUtterance.onend) {
        capturedUtterance.onend(new MockSpeechSynthesisEvent('end', { utterance: capturedUtterance }))
      }

      expect(isSpeaking.value).toBe(false)
    })

    it('should handle speech error', () => {
      const { speak, isSpeaking, error } = useTextToSpeech()
      const MockSpeechSynthesisErrorEvent = (globalThis as any).SpeechSynthesisErrorEvent

      speak('Hello world')
      expect(isSpeaking.value).toBe(true)

      if (capturedUtterance && capturedUtterance.onerror) {
        const errorEvent = new MockSpeechSynthesisErrorEvent('error', {
          utterance: capturedUtterance,
          error: 'network',
        })
        capturedUtterance.onerror(errorEvent)
      }

      expect(isSpeaking.value).toBe(false)
      expect(error.value).toContain('Speech error')
    })
  })

  describe('pause', () => {
    it('should pause speech', () => {
      const { speak, pause, isPaused } = useTextToSpeech()

      speak('Hello world')
      pause()

      expect(mockSpeechSynthesis.pause).toHaveBeenCalledTimes(1)
      expect(isPaused.value).toBe(true)
    })

    it('should not pause when not speaking', () => {
      const { pause } = useTextToSpeech()

      pause()

      expect(mockSpeechSynthesis.pause).not.toHaveBeenCalled()
    })
  })

  describe('resume', () => {
    it('should resume paused speech', () => {
      const { speak, pause, resume, isPaused } = useTextToSpeech()

      speak('Hello world')
      pause()
      expect(isPaused.value).toBe(true)

      resume()

      expect(mockSpeechSynthesis.resume).toHaveBeenCalledTimes(1)
      expect(isPaused.value).toBe(false)
    })

    it('should not resume when not paused', () => {
      const { resume } = useTextToSpeech()

      resume()

      expect(mockSpeechSynthesis.resume).not.toHaveBeenCalled()
    })
  })

  describe('stop', () => {
    it('should stop speech', () => {
      const { speak, stop, isSpeaking } = useTextToSpeech()

      speak('Hello world')
      stop()

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalledTimes(1)
      expect(isSpeaking.value).toBe(false)
    })

    it('should stop paused speech', () => {
      const { speak, pause, stop, isSpeaking, isPaused } = useTextToSpeech()

      speak('Hello world')
      pause()
      stop()

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalledTimes(1)
      expect(isSpeaking.value).toBe(false)
      expect(isPaused.value).toBe(false)
    })

    it('should do nothing when not speaking', () => {
      const { stop } = useTextToSpeech()

      stop()

      expect(mockSpeechSynthesis.cancel).not.toHaveBeenCalled()
    })
  })

  describe('browser support', () => {
    it('should handle missing speechSynthesis API', () => {
      Object.defineProperty(globalThis, 'speechSynthesis', {
        writable: true,
        configurable: true,
        value: undefined,
      })

      const { speak, error } = useTextToSpeech()

      speak('Hello world')

      expect(error.value).toBe('Text-to-Speech is not supported in this browser')
    })
  })
})
