<template>
  <div class="banner" data-testid="article-banner">
    <div class="container">
      <h1>{{ displayTitle }}</h1>

      <ArticleDetailMeta
        v-if="article"
        :article="article"
        @update="updateArticle"
      />
    </div>
  </div>

  <div class="container page">
    <!-- Translation Controls -->
    <div class="translation-controls" data-testid="translation-controls">
      <div class="translation-bar">
        <label for="target-language" class="language-label">
          Translate to:
        </label>
        <select
          id="target-language"
          class="language-select"
          v-model="selectedLanguage"
          :disabled="isTranslating"
          data-testid="language-select"
        >
          <option value="">
            Original
          </option>
          <option
            v-for="(name, code) in supportedLanguages"
            :key="code"
            :value="code"
          >
            {{ name }}
          </option>
        </select>
        <button
          class="btn btn-sm btn-outline-primary translate-btn"
          :disabled="!selectedLanguage || isTranslating"
          data-testid="translate-button"
          @click="translateArticle"
        >
          <span v-if="isTranslating">Translating...</span>
          <span v-else-if="isTranslated">Show Translation</span>
          <span v-else>Translate</span>
        </button>
        <button
          v-if="isTranslated"
          class="btn btn-sm btn-outline-secondary reset-btn"
          data-testid="reset-translation-button"
          @click="resetTranslation"
        >
          Show Original
        </button>
      </div>
      <div
        v-if="translationError"
        class="translation-error"
        data-testid="translation-error"
      >
        {{ translationError }}
      </div>
    </div>

    <div class="row article-content">
      <!-- eslint-disable vue/no-v-html -->
      <div
        id="article-content"
        class="col-md-12"
        data-testid="article-body"
        v-html="displayBody"
      />
      <!-- eslint-enable vue/no-v-html -->

      <!-- TODO: abstract tag list component -->
      <ul class="tag-list">
        <li
          v-for="tag in article.tagList"
          :key="tag"
          class="tag-default tag-pill tag-outline"
          data-testid="article-tag"
        >
          {{ tag }}
        </li>
      </ul>
    </div>

    <hr>

    <div class="article-actions" data-testid="article-actions">
      <ArticleDetailMeta
        v-if="article"
        :article="article"
        @update="updateArticle"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getSupportedLanguages, useTranslation } from 'src/composable/use-translation'
import type { SupportedLanguage } from 'src/composable/use-translation'
import marked from 'src/plugins/marked'
import { api } from 'src/services'
import type { Article } from 'src/services/api'
import ArticleDetailMeta from './ArticleDetailMeta.vue'

const route = useRoute()
const slug = route.params.slug as string
const article: Article = reactive(await api.articles.getArticle(slug).then(res => res.data.article))

const articleHandledBody = computed(() => marked(article.body))

// Translation state
const {
  translate,
  translatedText: translatedBody,
  isTranslating,
  error: translationError,
  reset: resetTranslationState,
} = useTranslation()

const {
  translate: translateTitle,
  translatedText: translatedTitleText,
} = useTranslation()

const selectedLanguage = ref<SupportedLanguage | ''>('')
const isTranslated = ref(false)
const supportedLanguages = getSupportedLanguages()

// Display computed properties
const displayTitle = computed(() => {
  return isTranslated.value && translatedTitleText.value
    ? translatedTitleText.value
    : article.title
})

const displayBody = computed(() => {
  if (isTranslated.value && translatedBody.value) {
    return marked(translatedBody.value)
  }
  return articleHandledBody.value
})

async function translateArticle() {
  if (!selectedLanguage.value)
    return

  try {
    // Translate both title and body
    await Promise.all([
      translate(article.body, selectedLanguage.value),
      translateTitle(article.title, selectedLanguage.value),
    ])

    isTranslated.value = true
  }
  catch (error) {
    console.error('Translation failed:', error)
  }
}

function resetTranslation() {
  resetTranslationState()
  isTranslated.value = false
}

// Reset translation when language selection is cleared
watch(selectedLanguage, newLang => {
  if (!newLang) {
    resetTranslation()
  }
})

function updateArticle(newArticle: Article) {
  Object.assign(article, newArticle)
}
</script>

<style scoped>
.translation-controls {
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: #f3f3f3;
  border-radius: 4px;
}

.translation-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.language-label {
  font-weight: 500;
  margin: 0;
  color: #373a3c;
}

.language-select {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: white;
  font-size: 0.9rem;
  min-width: 200px;
  cursor: pointer;
}

.language-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.translate-btn,
.reset-btn {
  margin: 0;
}

.translate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.translation-error {
  margin-top: 0.75rem;
  padding: 0.5rem;
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .translation-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .language-select {
    width: 100%;
  }
}
</style>
