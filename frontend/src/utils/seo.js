import { useEffect } from 'react';

const SITE = String(import.meta.env.VITE_SITE_URL || '').replace(/\/$/, '');

function setMeta(selector, attribute, value) {
  const node = document.querySelector(selector);
  if (node && value) node.setAttribute(attribute, value);
}

export function usePageMeta({ title, description, path = '' }) {
  useEffect(() => {
    const fullTitle = title ? `${title} · Skill Connect` : 'Skill Connect';
    document.title = fullTitle;
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', fullTitle);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[name="twitter:title"]', 'content', fullTitle);
    setMeta('meta[name="twitter:description"]', 'content', description);

    if (!SITE) return undefined;
    const url = `${SITE}${path || window.location.pathname}`;
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
    setMeta('meta[property="og:url"]', 'content', url);
    setMeta('meta[property="og:image"]', 'content', `${SITE}/og.svg`);
    return undefined;
  }, [title, description, path]);
}
