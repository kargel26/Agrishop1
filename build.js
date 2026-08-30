/**
 * Build script to bundle Speed Insights for static site
 */
const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/speed-insights.js'],
  bundle: true,
  minify: true,
  outfile: 'assets/speed-insights.js',
  format: 'iife',
  platform: 'browser',
  target: 'es2015',
}).then(() => {
  console.log('✅ Speed Insights bundle created successfully!');
}).catch((error) => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});
