/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ANALYTICS_ID?: string
  readonly VITE_ENABLE_PREVIEW?: string
  readonly VITE_ENABLE_ANALYTICS?: string
  readonly VITE_DEBUG_MODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
