# Projet Web Engineering

> **Application développée dans le cadre d'un projet de Master, par Ewen Carré et Julien Sailly.**

## Installation et lancement

### Prérequis

- **Node.js** (version 18 ou supérieure)
- **pnpm** (gestionnaire de paquets)

### Installation de pnpm (si nécessaire)

```bash
npm install -g pnpm
```

### Installation des dépendances

```bash
pnpm install
```

### Lancement en mode développement

```bash
pnpm dev
```

## Fonctionnalités implémentées

Ce projet contient trois fonctionnalités principales développées dans le cadre du projet :

### 1. Traduction d'articles

**Branche :** `feature/article-translation`

**Description :**
Permet de traduire le contenu des articles en 16 langues différentes grâce à l'API MyMemory Translation.

**Fonctionnalités :**
- Sélecteur de langue dans la page de détail d'un article
- Traduction du titre et du contenu de l'article
- Support de 16 langues : Français, Espagnol, Allemand, Italien, Portugais, Russe, Japonais, Coréen, Chinois, Arabe, Hindi, Néerlandais, Polonais, Turc, Suédois, Danois
- Gestion des états de chargement et d'erreur
- Persistance de la traduction lors de la navigation

**Fichiers principaux :**
- `src/composable/use-translation.ts` : Logique de traduction
- `src/components/ArticleDetail.vue` : Interface utilisateur avec sélecteur de langue
- Tests : `src/composable/use-translation.spec.ts`

**API utilisée :** [MyMemory Translation API](https://mymemory.translated.net/) (gratuite, sans clé API requise)

### 2. Text-to-Speech (TTS)

**Branche :** `feature/article-tts`

**Description :**
Permet d'écouter le contenu des articles grâce à la synthèse vocale du navigateur (Web Speech API).

**Fonctionnalités :**
- Bouton lecture/pause/arrêt pour contrôler la lecture audio
- Lecture du titre et du contenu de l'article
- **Adaptation automatique de la langue** : lorsqu'un article est traduit, le TTS utilise la langue de traduction appropriée (ex: voix française pour une traduction en français)
- Support de 15+ langues avec mapping automatique (fr → fr-FR, es → es-ES, etc.)
- Indicateur visuel de l'état de lecture
- Gestion des erreurs sans affichage intrusif (filtrage des erreurs "canceled" et "interrupted")
- Contrôles accessibles au clavier

**Fichiers principaux :**
- `src/composable/use-text-to-speech.ts` : Logique TTS avec gestion des erreurs
- `src/components/ArticleDetail.vue` : Intégration avec fonction `getTTSLanguage()` pour mapper les codes de langue
- Tests : `src/composable/use-text-to-speech.spec.ts` (19 tests), `src/components/ArticleDetail.spec.ts` (13 tests)

**API utilisée :** [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) (native au navigateur)

**Améliorations apportées :**
- Filtrage des erreurs `canceled` et `interrupted` pour éviter l'affichage d'erreurs lors de l'arrêt manuel
- Lecture du texte traduit au lieu du texte original quand une traduction est active
- Changement automatique de la langue TTS en fonction de la langue de traduction

### 3. Widget Météo

**Branche :** `feature/meteo-and-location`

**Description :**
Widget météo intégré dans la barre de navigation, affichant les informations météorologiques en temps réel.

**Fonctionnalités :**
- **Affichage compact** : emoji météo + température dans la navbar
- **Vue détaillée** : ville, température, description, vitesse du vent, humidité
- **Localisation par défaut** : Paris (France)
- **Géolocalisation** : bouton "Ma Position" pour obtenir la météo de la position actuelle de l'utilisateur
- **Emojis météo** : représentation visuelle intuitive (soleil, nuages, pluie, orage, neige, brouillard)
- **Accessibilité** : navigation au clavier (Enter/Espace pour ouvrir/fermer)
- **Responsive** : s'adapte à toutes les tailles d'écran

**Fichiers principaux :**
- `src/composable/use-weather.ts` : Logique de récupération des données météo
- `src/components/WeatherWidget.vue` : Interface utilisateur du widget
- `src/components/AppNavigation.vue` : Intégration dans la navbar
- Tests : `src/composable/use-weather.spec.ts` (8 tests, 88.33% de couverture)
- Documentation : `WEATHER_WIDGET.md`

**API utilisée :** [Open-Meteo API](https://open-meteo.com/) (100% gratuite, sans clé API requise)
- API de géocodage pour convertir nom de ville → coordonnées
- API météo pour récupérer les données actuelles
- Utilise les codes WMO pour la description météo

## Branches de développement

Le projet utilise une stratégie de branches Git pour organiser le développement :

- **`main`** : Branche principale contenant le code stable et fusionné
- **`feature/article-translation`** : Développement de la fonctionnalité de traduction (TP1)
- **`feature/article-tts`** : Développement de la fonctionnalité TTS (TP2)
- **`feature/meteo-and-location`** : Développement du widget météo (TP3)

Chaque fonctionnalité a été développée dans sa propre branche feature, testée, puis fusionnée dans `main`.

## Tests

Le projet maintient une excellente couverture de tests :

### Tests unitaires (Vitest)

```bash
pnpm test:unit
```

**Couverture par fonctionnalité :**
- **Traduction** : Tests complets avec mocks de l'API MyMemory
- **TTS** : 19 tests pour le composable + 13 tests pour le composant ArticleDetail
- **Météo** : 8 tests avec 88.33% de couverture du composable

### Tests E2E (Playwright)

```bash
pnpm test:e2e
```

Tests d'intégration couvrant les parcours utilisateurs complets.

---

## Technologies utilisées

### Framework et langages
- Vue
- TypeScript
- Vite

### State Management et Routing
- Pinia
- Vue Router

### Tests
- Vitest
- Testing Library
- Playwright

### APIs externes
- MyMemory Translation API
- Open-Meteo API
- Web Speech API
- Geolocation API
