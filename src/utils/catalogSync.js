// El evento nativo 'storage' del navegador SOLO se dispara en otras
// pestañas/ventanas, nunca en la pestaña donde se hizo el cambio.
// Como Admin y Home viven en la misma pestaña (SPA por estado, sin
// rutas reales), necesitamos un evento propio para que Home se entere
// al instante cuando Admin toca localStorage.

export const CATALOG_UPDATED_EVENT = 'mates-josef:local-storage-updated';

export function writeAndNotify(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(CATALOG_UPDATED_EVENT, { detail: { key } }));
}