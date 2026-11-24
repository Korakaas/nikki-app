declare const __APP_VERSION__: { number: string; date: string; commit: string }

/** « Version 87 · 24/11/2026 17:20 · e832b2b » : permet de vérifier que le téléphone a la bonne version (S18.21). */
export const VERSION_LABEL = `Version ${__APP_VERSION__.number} · ${__APP_VERSION__.date} · ${__APP_VERSION__.commit}`
