import { onUnmounted, ref } from 'vue'
import type { Ref } from 'vue'

export interface UseTextToSpeechReturn {
  speak: (text: string, lang?: string) => void
  pause: () => void
  resume: () => void
  stop: () => void
  isSpeaking: Ref<boolean>
  isPaused: Ref<boolean>
  error: Ref<string | null>
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const isSpeaking = ref<boolean>(false)
  const isPaused = ref<boolean>(false)
  const error = ref<string | null>(null)
  let currentUtterance: SpeechSynthesisUtterance | null = null

  function checkBrowserSupport(): boolean {
    if (globalThis.window === undefined || !globalThis.speechSynthesis) {
      error.value = 'Text-to-Speech is not supported in this browser'
      return false
    }
    return true
  }

  function speak(text: string, lang: string = 'en-US'): void {
    if (!checkBrowserSupport())
      return

    if (!text.trim()) {
      error.value = 'Text cannot be empty'
      return
    }

    stop()
    error.value = null

    currentUtterance = new SpeechSynthesisUtterance(text)
    currentUtterance.lang = lang
    currentUtterance.rate = 1
    currentUtterance.pitch = 1
    currentUtterance.volume = 1

    currentUtterance.onstart = () => {
      isSpeaking.value = true
      isPaused.value = false
    }

    currentUtterance.onend = () => {
      isSpeaking.value = false
      isPaused.value = false
      currentUtterance = null
    }

    // eslint-disable-next-line unicorn/prefer-add-event-listener
    currentUtterance.onerror = event => {
      // Ignore cancelled/interrupted errors (these happen when user stops speech)
      if (event.error === 'canceled' || event.error === 'interrupted') {
        isSpeaking.value = false
        isPaused.value = false
        currentUtterance = null
        return
      }
      error.value = `Speech error: ${event.error}`
      isSpeaking.value = false
      isPaused.value = false
      currentUtterance = null
    }

    currentUtterance.onpause = () => {
      isPaused.value = true
    }

    currentUtterance.onresume = () => {
      isPaused.value = false
    }

    globalThis.speechSynthesis.speak(currentUtterance)
  }

  function pause(): void {
    if (!checkBrowserSupport())
      return

    if (isSpeaking.value && !isPaused.value) {
      globalThis.speechSynthesis.pause()
      isPaused.value = true
    }
  }

  function resume(): void {
    if (!checkBrowserSupport())
      return

    if (isSpeaking.value && isPaused.value) {
      globalThis.speechSynthesis.resume()
      isPaused.value = false
    }
  }

  function stop(): void {
    if (!checkBrowserSupport())
      return

    if (isSpeaking.value || isPaused.value) {
      globalThis.speechSynthesis.cancel()
      isSpeaking.value = false
      isPaused.value = false
      currentUtterance = null
    }
  }

  onUnmounted(() => {
    stop()
  })

  return {
    speak,
    pause,
    resume,
    stop,
    isSpeaking,
    isPaused,
    error,
  }
}
