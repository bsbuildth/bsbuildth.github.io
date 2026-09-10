import { loadEnv } from 'vite';
import { writeFileSync, copyFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
const origin = 'https://bsbuildth.github.io';
const urls = ['/', '/blog'];
// Optional JSON export of PUBLIC article slugs. No production credentials in the build.
const source = process.env.PUBLIC_ARTICLES_FILE;
if (process.env.BUILD_PUBLIC_SITEMAP === 'true') {
 const env = { ...loadEnv('production', process.cwd(), 'VITE_'), ...process.env };
 if (!env.VITE_FIREBASE_PROJECT_ID) throw new Error('Missing Firebase project for sitemap');
 const response = await fetch(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(env.VITE_FIREBASE_PROJECT_ID)}/databases/(default)/documents:runQuery`, {
   method:'POST', headers:{'Content-Type':'application/json'}, signal:AbortSignal.timeout(20000),
   body:JSON.stringify({structuredQuery:{from:[{collectionId:'articles'}],select:{fields:[{fieldPath:'slug'}]},where:{fieldFilter:{field:{fieldPath:'is_visible'},op:'IN',value:{arrayValue:{values:[{booleanValue:true},{integerValue:'1'}]}}}}}})
 });
 if (!response.ok) throw new Error(`Sitemap read failed: ${response.status}`);
 for (const row of await response.json()) {
   const slug=row.document?.fields?.slug?.stringValue;
   if (slug && /^[\p{L}\p{M}\p{N}_-]+$/u.test(slug)) urls.push(`/blog/${encodeURIComponent(slug)}`);
 }
}
if (source) {
  const articles = JSON.parse(readFileSync(source, 'utf8'));
  for (const article of articles) if ([true,1].includes(article.is_visible) && /^[\p{L}\p{M}\p{N}_-]+$/u.test(article.slug || '')) urls.push(`/blog/${encodeURIComponent(article.slug)}`);
}
const escapeXml = text => text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
writeFileSync('dist/sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+[...new Set(urls)].map(path => `<url><loc>${escapeXml(origin+path)}</loc></url>`).join('')+'</urlset>');
// Known blog route has a real static entry on Pages; unknown paths retain 404 status.
mkdirSync('dist/blog', { recursive: true });
copyFileSync('dist/index.html','dist/blog/index.html');
for (const path of urls.slice(2)) { mkdirSync(`dist${decodeURIComponent(path)}`, { recursive:true }); copyFileSync('dist/index.html',`dist${decodeURIComponent(path)}/index.html`); }
if (!existsSync('dist/404.html')) throw new Error('Missing fallback');
