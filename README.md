# AgriMart - Agricultural Products Marketplace

AgriMart is India's trusted online marketplace for seeds, fertilizers, crop protection, tools, irrigation and more — delivered from verified sellers to your farm gate.

## Features

- Browse and shop agricultural products
- Verified sellers
- Secure payments
- Fast delivery
- Customer support

## Speed Insights

This project is configured with [Vercel Speed Insights](https://vercel.com/docs/speed-insights) to monitor web performance and vitals.

### Setup

The Speed Insights integration is set up as follows:

1. **Package**: `@vercel/speed-insights` is installed as a dependency
2. **Build Process**: A build script bundles the Speed Insights initialization code
3. **Integration**: The bundled script is loaded on all pages via `<script defer src="assets/speed-insights.js"></script>`

### Building

To rebuild the Speed Insights bundle after making changes:

```bash
npm run build
```

This command uses esbuild to bundle the Speed Insights initialization script into `assets/speed-insights.js`.

### How It Works

- The Speed Insights script automatically tracks web vitals (LCP, FID, CLS, FCP, TTFB, INP)
- Data is only collected in production (not in development mode)
- The script is loaded with `defer` attribute for optimal performance
- Performance data can be viewed in the Vercel Dashboard

## Development

This is a static HTML/CSS/JavaScript website. No build process is required for the main site files, only for the Speed Insights integration.

### Project Structure

```
.
├── assets/
│   ├── common.js          # Shared header/footer
│   ├── data.js            # Product and category data
│   ├── style.css          # Main styles
│   └── speed-insights.js  # Bundled Speed Insights script (generated)
├── policies/              # Policy pages
├── src/
│   └── speed-insights.js  # Speed Insights source (before bundling)
├── *.html                 # Individual pages
├── build.js               # Build script for Speed Insights
└── package.json           # Dependencies and scripts
```

## Deployment

Deploy to Vercel for automatic Speed Insights integration:

1. Connect your repository to Vercel
2. Deploy your site
3. View Speed Insights data in the Vercel Dashboard

## License

ISC
