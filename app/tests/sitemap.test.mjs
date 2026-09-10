import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep, basename } from 'node:path';
import { execFileSync } from 'node:child_process';
test('sitemap includes public slugs and real static route files; omits drafts and path traversal', () => {
 const dir=mkdtempSync(join(tmpdir(),'bsbuild-sitemap-'));
 try {
  mkdirSync(join(dir,'dist'));writeFileSync(join(dir,'dist/index.html'),'<html>test</html>');writeFileSync(join(dir,'dist/404.html'),'<html>test</html>');
  writeFileSync(join(dir,'articles.json'),JSON.stringify([{slug:'ครัว',is_visible:1},{slug:'private',is_visible:0},{slug:'../../escape',is_visible:1}]));
  execFileSync(process.execPath,[resolve('scripts/build-sitemap.mjs')],{cwd:dir,env:{...process.env,BUILD_PUBLIC_SITEMAP:'false',PUBLIC_ARTICLES_FILE:join(dir,'articles.json')}});
  const xml=readFileSync(join(dir,'dist/sitemap.xml'),'utf8');
  assert.ok(xml.includes(encodeURIComponent('ครัว')));assert.ok(!xml.includes('private'));assert.ok(!xml.includes('escape'));
  assert.ok(existsSync(join(dir,'dist/blog/ครัว/index.html')));assert.ok(existsSync(join(dir,'dist/blog/index.html')));
 } finally { assert.ok(resolve(dir).startsWith(resolve(tmpdir()) + sep) && basename(dir).startsWith('bsbuild-sitemap-')); rmSync(dir,{recursive:true,force:true}); }
});
