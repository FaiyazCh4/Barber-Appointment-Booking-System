import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.resolve(rootDir, 'public');

export interface SitemapRoute {
  path: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: string;
  lastmod?: string;
  description?: string;
}

// Canonical domain
const BASE_URL = 'https://georgedavishairdressing.co.uk';

// Application pages for indexing (EXCLUDES /admin and /manage booking management routes)
export const SITEMAP_ROUTES: SitemapRoute[] = [
  {
    path: '/',
    changefreq: 'weekly',
    priority: '1.0',
    description: 'Home page & salon overview',
  },
  {
    path: '/services',
    changefreq: 'weekly',
    priority: '0.9',
    description: 'Curly hair specialist care, hair replacement, bespoke cutting & balayage',
  },
  {
    path: '/book',
    changefreq: 'daily',
    priority: '0.9',
    description: 'Direct appointment booking engine',
  },
  {
    path: '/team',
    changefreq: 'monthly',
    priority: '0.8',
    description: 'Our senior stylists, colour masters, and hair replacement specialists',
  },
  {
    path: '/contact',
    changefreq: 'monthly',
    priority: '0.8',
    description: 'Salon location, opening hours & contact details in Bromsgrove',
  },
  {
    path: '/gallery',
    changefreq: 'weekly',
    priority: '0.7',
    description: 'Salon transformations, curly styling & hair replacement portfolio',
  },
  {
    path: '/about',
    changefreq: 'monthly',
    priority: '0.7',
    description: 'Salon heritage, philosophy & independent boutique story',
  },
  {
    path: '/policies',
    changefreq: 'monthly',
    priority: '0.6',
    description: 'Skin patch testing (48h), cancellation policies & privacy',
  },
];

/**
 * EXCLUDED ROUTES (Security & Search Engine Quality):
 * - /admin (administrative control panel & staff operations)
 * - /manage (customer appointment lookups & confidential booking management)
 * - /api/* (server API endpoints)
 */
export const EXCLUDED_ROUTES = ['/admin', '/manage', '/api'];

export function generateSitemapXml(routes: SitemapRoute[] = SITEMAP_ROUTES): string {
  const today = new Date().toISOString().split('T')[0];

  const urlEntries = routes
    .filter((route) => !EXCLUDED_ROUTES.some((excluded) => route.path.startsWith(excluded)))
    .map((route) => {
      const loc = route.path === '/' ? `${BASE_URL}/` : `${BASE_URL}${route.path}`;
      const lastmod = route.lastmod || today;
      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;
}

export function buildSitemap() {
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const sitemapXml = generateSitemapXml();
  const sitemapPath = path.resolve(publicDir, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemapXml, 'utf-8');
  console.log(`[SEO Build] Generated sitemap.xml with ${SITEMAP_ROUTES.length} public routes.`);
  console.log(`[SEO Build] Excluded routes: ${EXCLUDED_ROUTES.join(', ')}.`);
}

// Run if called directly
buildSitemap();
