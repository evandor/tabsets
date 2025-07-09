# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tabsets is a Vue 3-based browser extension that helps users organize and manage their browser tabs using collections called "tabsets." The extension supports Chrome and Firefox and includes multiple deployment modes (BEX, PWA, desktop).

## Development Commands

### Development
```bash
# Start development server for Chrome
yarn dev
# or
quasar dev -m bex -T chrome

# Start development server for Firefox
yarn "dev firefox"
# or
quasar dev -m bex -T firefox

# PWA development mode
yarn "pwa (for debug)"
# or
quasar dev --mode pwa
```

### Building
```bash
# Build for Chrome
yarn "build bex chrome"
# or
quasar build -m bex -T chrome

# Build for Firefox
yarn "build bex firefox"
# or
quasar build -m bex -T firefox
```

### Testing
```bash
# Run unit tests
yarn test:unit

# Run unit tests with UI
yarn test:unit:ui

# Run unit tests with coverage
yarn test:unit:coverage

# Run unit tests in watch mode
yarn test:unit:watch

# Run E2E tests
yarn test:e2e

# Run E2E tests with UI
yarn "test:e2e ui"

# Run specific test
yarn test:specificTest

# Run specific test with debug
yarn test:specificTest:debug
```

### Code Quality
```bash
# Lint the codebase
yarn lint

# Format code
yarn format
```

### Documentation
```bash
# Start documentation server
yarn docs:dev

# Build documentation
yarn docs:build

# Preview documentation
yarn docs:preview
```

## Architecture Overview

### Core Technology Stack
- **Frontend**: Vue 3 with Composition API + Quasar UI framework
- **State Management**: Pinia stores
- **Build System**: Quasar CLI with Vite
- **Persistence**: IndexedDB (primary) + LocalStorage + Firebase (optional)
- **Search**: Fuse.js for client-side search
- **Extension APIs**: Chrome Extension APIs (Manifest V3)
- **Language**: TypeScript with strict mode

### Domain Architecture
The codebase follows a **modular domain-driven structure** where each domain has its own isolated folder:

- **src/tabsets/**: Main business logic for tab management, tabset CRUD operations, action handling
- **src/bookmarks/**: Browser bookmarks integration, import/export functionality
- **src/content/**: Content management, tab content indexing, snapshot storage
- **src/search/**: Search functionality with Fuse.js integration
- **src/core/**: Foundation layer with common components, services, utilities
- **src/snapshots/**: Tab snapshots (HTML, MHTML, PDF, PNG, WARC)
- **src/spaces/**: Workspace concept for organizing tabsets
- **src/features/**: Feature flag management
- **src/windows/**: Window management for browser tabs

### Key Architectural Patterns

#### 1. Command Pattern
Every action is implemented as a command:
```typescript
// src/core/domain/Command.ts
export default interface Command<T> {
  execute: () => Promise<ExecutionResult<T>>
}
```

#### 2. Repository Pattern for Persistence
Each domain implements multiple persistence backends:
- `IndexedDbTabsetsPersistence` (primary)
- `LocalStorageTabsetsPersistence` (fallback)
- `FirestoreTabsetsPersistence` (cloud sync)

#### 3. Store Pattern (Pinia)
Domain stores with reactive state:
```typescript
export const useTabsetsStore = defineStore('tabsets', () => {
  const tabsets = ref<Map<string, Tabset>>(new Map())
  // ... methods
})
```

### Core Domain Models

- **Tabset**: Primary entity representing a collection of tabs
- **Tab**: Represents a single browser tab or bookmark
- **Space**: Workspace concept for organizing tabsets
- **Bookmark**: Import/export integration with browser bookmarks

### Browser Extension Architecture

#### Extension Structure (src-bex/)
- **background.ts**: Service worker (Manifest V3) handling Chrome API events
- **tabsets-content-script.ts**: General page integration
- **tabsets-toolbar-contentscript.ts**: Toolbar injection
- **tabsets-excalidraw-script.ts**: Excalidraw integration

#### Multi-Context Support
- **Popup**: Quick access interface
- **Side Panel**: Main working interface
- **Full Page**: Comprehensive view
- **Options Page**: Settings management

### Component Organization

#### Layouts (src/layouts/)
- `SidePanelLayout.vue`: Side panel container
- `PopupLayout.vue`: Extension popup
- `FullPageLayout.vue`: Full-screen mode

#### Pages (src/*/pages/)
Domain-specific page components and route components

#### Components (src/*/components/)
Reusable UI components and domain-specific widgets

### State Management

#### Core Stores
- `appStore`: Application state
- `tabsetsStore`: Tabset management
- `uiStore`: UI state
- `searchStore`: Search functionality
- `featuresStore`: Feature flags

### Key Services

- **AppService**: Application initialization and service orchestration
- **TabsetService**: Core tabset operations and tab management
- **ContentService**: Content indexing and snapshot management
- **ThumbnailsService**: Tab screenshot capture and thumbnail generation
- **BrowserApi**: Chrome extension API wrapper and browser event handling

## Important Development Notes

### Environment Setup
This project uses git submodules. Clone with:
```bash
git clone --recurse-submodules -j8 https://github.com/evandor/tabsets.git
```

### File Structure Conventions
- Each domain follows the pattern: `models/`, `stores/`, `services/`, `persistence/`, `commands/`, `components/`, `pages/`
- Use TypeScript with strict mode enabled
- Follow Vue 3 Composition API patterns
- Implement proper error handling throughout

### Testing
- Unit tests use Vitest
- E2E tests use Playwright
- Tests are located in `test/` directory
- Browser extension testing requires specific setup for extension APIs

### Browser Extension Development
- Development primarily targets Chrome (Manifest V3)
- Firefox support through cross-browser compatibility
- Uses Chrome extension APIs for tabs, bookmarks, storage, sidePanel
- Message passing between background script, content scripts, and UI

### Build Process
- Uses Quasar CLI with Vite for building
- Supports multiple deployment modes: BEX (Browser Extension), PWA, desktop
- TypeScript compilation with strict mode
- ESLint for code quality with flat config

### Data Persistence
- Primary storage: IndexedDB for structured data
- Fallback: LocalStorage for simple key-value storage
- Optional: Firebase for cloud synchronization
- Backup: GitHub integration for data backup

This architecture ensures maintainability, testability, and scalability while providing a rich user experience across different browser environments.