/**
 * Utilitaire de détection automatique universelle du nom de domaine
 * Fonctionne automatiquement sur TOUS les hébergeurs :
 * Vercel, Netlify, VPS, serveurs dédiés, domaine personnalisé (.cm, .com, etc.)
 * SANS AUCUN nom de domaine figé ou codé en dur.
 */

export function getAutoDomain(): string {
  if (typeof window !== 'undefined') {
    // 1. Si l'administrateur a configuré un domaine cible personnalisé dans son stockage local
    const customStored = localStorage.getItem('votemoi_custom_domain')?.trim();
    if (customStored && customStored.startsWith('http')) {
      return customStored.replace(/\/$/, '');
    }

    // 2. Variable d'environnement publique si configurée
    const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (envUrl && envUrl.startsWith('http')) {
      return envUrl.replace(/\/$/, '');
    }

    // 3. Détection 100% dynamique du domaine actif dans le navigateur
    if (window.location.origin && window.location.origin.startsWith('http')) {
      return window.location.origin;
    }
  }

  // Côté serveur / SSR sans requête HTTP
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envUrl && envUrl.startsWith('http')) {
    return envUrl.replace(/\/$/, '');
  }

  return '';
}

/**
 * Détection automatique du nom de domaine côté serveur à partir des en-têtes HTTP de la requête.
 * Fonctionne dynamiquement avec TOUS les hébergeurs ou reverse-proxies (Vercel, Netlify, Nginx, Cloudflare, etc.)
 */
export function getRequestDomain(request: Request): string {
  try {
    const forwardedHost = request.headers.get('x-forwarded-host');
    const host = forwardedHost || request.headers.get('host') || '';
    const forwardedProto = request.headers.get('x-forwarded-proto');

    const isLocal =
      !host ||
      host.includes('localhost') ||
      host.includes('127.0.0.1') ||
      host.startsWith('192.168.');

    const proto = forwardedProto || (isLocal ? 'http' : 'https');

    // Détection 100% dynamique basée sur l'hôte réel de la requête reçue
    if (host) {
      return `${proto}://${host}`;
    }

    // En local, vérifier si NEXT_PUBLIC_SITE_URL est configuré
    const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (envUrl && envUrl.startsWith('http')) {
      return envUrl.replace(/\/$/, '');
    }

    return '';
  } catch {
    return '';
  }
}

/**
 * Génère le lien secret complet vers l'espace organisateur
 */
export function getOrganizerLink(tokenOrSlug: string): string {
  const base = getAutoDomain();
  return base ? `${base}/organisateur/${tokenOrSlug}` : `/organisateur/${tokenOrSlug}`;
}
