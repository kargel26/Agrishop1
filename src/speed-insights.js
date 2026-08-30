/**
 * Vercel Speed Insights initialization script
 * This file bundles and initializes Speed Insights for the AgriMart website
 */

import { injectSpeedInsights } from '@vercel/speed-insights';

// Initialize Speed Insights when the DOM is ready
if (typeof window !== 'undefined') {
  // Inject Speed Insights
  injectSpeedInsights({
    debug: false, // Set to true for development debugging
  });
}
