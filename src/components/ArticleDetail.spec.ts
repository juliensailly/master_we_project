import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/vue'
import fixtures from 'src/utils/test/fixtures'
import { asyncWrapper, renderOptions, setupMockServer } from 'src/utils/test/test.utils'
import ArticleDetail from './ArticleDetail.vue'

// Mock the translation composable
vi.mock('src/composable/use-translation', () => ({
  useTranslation: vi.fn(() => ({
    translate: vi.fn().mockResolvedValue(undefined),
    translatedText: ref(''),
    isTranslating: ref(false),
    error: ref(null),
    reset: vi.fn(),
  })),
  getSupportedLanguages: vi.fn(() => ({
    es: 'Spanish',
    fr: 'French',
    de: 'German',
  })),
}))

describe('# ArticleDetail', () => {
  const server = setupMockServer(
    ['/api/articles/markdown', { article: { ...fixtures.article, body: fixtures.markdown } }],
    ['/api/articles/markdown-cn', { article: { ...fixtures.article, body: fixtures.markdownCN } }],
    ['/api/articles/markdown-xss', { article: { ...fixtures.article, body: fixtures.markdownXss } }],
  )

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render markdown body correctly', async () => {
    const { container } = render(asyncWrapper(ArticleDetail), await renderOptions({
      initialRoute: { name: 'article', params: { slug: 'markdown' } },
    }))
    await server.waitForRequest('GET', '/api/articles/markdown')

    expect(container.querySelector('#article-content')).toMatchSnapshot()
  })

  it('should render markdown (zh-CN) body correctly', async () => {
    const { container } = render(asyncWrapper(ArticleDetail), await renderOptions({
      initialRoute: { name: 'article', params: { slug: 'markdown-cn' } },
    }))
    await server.waitForRequest('GET', '/api/articles/markdown-cn')

    expect(container.querySelector('#article-content')).toMatchSnapshot()
  })

  it('should filter the xss content in Markdown body', async () => {
    const { container } = render(asyncWrapper(ArticleDetail), await renderOptions({
      initialRoute: { name: 'article', params: { slug: 'markdown-xss' } },
    }))
    await server.waitForRequest('GET', '/api/articles/markdown-xss')

    expect(container.querySelector('#article-content')).toMatchSnapshot()
  })

  describe('translation feature', () => {
    it('should render translation controls', async () => {
      render(asyncWrapper(ArticleDetail), await renderOptions({
        initialRoute: { name: 'article', params: { slug: 'markdown' } },
      }))
      await server.waitForRequest('GET', '/api/articles/markdown')

      expect(screen.getByTestId('translation-controls')).toBeInTheDocument()
      expect(screen.getByTestId('language-select')).toBeInTheDocument()
      expect(screen.getByTestId('translate-button')).toBeInTheDocument()
    })

    it('should have language options in select', async () => {
      render(asyncWrapper(ArticleDetail), await renderOptions({
        initialRoute: { name: 'article', params: { slug: 'markdown' } },
      }))
      await server.waitForRequest('GET', '/api/articles/markdown')

      const select = screen.getByTestId('language-select')
      expect(select).toBeInTheDocument()

      // Should have "Original" option plus mocked languages
      expect(select.options.length).toBeGreaterThan(1)
      expect(select.options[0].value).toBe('')
      expect(select.options[0].text.trim()).toBe('Original')
    })

    it('should disable translate button when no language selected', async () => {
      render(asyncWrapper(ArticleDetail), await renderOptions({
        initialRoute: { name: 'article', params: { slug: 'markdown' } },
      }))
      await server.waitForRequest('GET', '/api/articles/markdown')

      const translateButton = screen.getByTestId('translate-button')
      expect(translateButton).toBeDisabled()
    })

    it('should display loading state while translating', async () => {
      const { useTranslation } = await import('src/composable/use-translation')
      vi.mocked(useTranslation).mockReturnValue({
        translate: vi.fn(),
        translatedText: ref(''),
        isTranslating: ref(true),
        error: ref(null),
        reset: vi.fn(),
      })

      render(asyncWrapper(ArticleDetail), await renderOptions({
        initialRoute: { name: 'article', params: { slug: 'markdown' } },
      }))
      await server.waitForRequest('GET', '/api/articles/markdown')

      const translateButton = screen.getByTestId('translate-button')
      expect(translateButton).toHaveTextContent('Translating...')
      expect(translateButton).toBeDisabled()
    })

    it('should display error message when translation fails', async () => {
      const { useTranslation } = await import('src/composable/use-translation')
      vi.mocked(useTranslation).mockReturnValue({
        translate: vi.fn(),
        translatedText: ref(''),
        isTranslating: ref(false),
        error: ref('Translation failed'),
        reset: vi.fn(),
      })

      render(asyncWrapper(ArticleDetail), await renderOptions({
        initialRoute: { name: 'article', params: { slug: 'markdown' } },
      }))
      await server.waitForRequest('GET', '/api/articles/markdown')

      const errorElement = screen.getByTestId('translation-error')
      expect(errorElement).toBeInTheDocument()
      expect(errorElement).toHaveTextContent('Translation failed')
    })
  })
})
