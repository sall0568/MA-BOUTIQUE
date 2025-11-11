/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  // ajoute ici uniquement tes variables personnalisées (commençant par VITE_)
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
