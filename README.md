# Vision-Language-Action Research Catalog

A responsive, mobile-first catalog of recent Vision-Language-Action (VLA) research. The interface is designed for production deployment with accessibility-friendly filters, theme switching, and progressive enhancement for the underlying JSON dataset.

## Project structure

```
VLA/
├── assets/
│   ├── css/
│   │   └── main.css        # Global styles
│   └── js/
│       └── main.js         # Catalog logic and interactions
├── index.html              # Application shell
└── vla_research.json       # Research dataset consumed by the UI
```

## Getting started

Because the catalog fetches local JSON, run it from a static file server rather than the filesystem (to avoid CORS restrictions).

```bash
# From the repository root
python3 -m http.server 8000
```

Visit [http://localhost:8000](http://localhost:8000) in your browser to explore the catalog.

## Key features

- **Mobile-first layout** that scales gracefully to large screens using CSS Grid.
- **Client-side filtering** across title, summary, tags, and publication year.
- **Persistent theme toggle** that honours system preferences and stores the user’s choice.
- **Robust error handling** for the dataset fetch with accessible loading and empty states.

## Production notes

- The UI avoids external dependencies; hosting the static assets on a CDN is sufficient.
- Minify `assets/css/main.css` and `assets/js/main.js` as part of your deployment pipeline if desired.
- Keep the `vla_research.json` schema stable to ensure compatibility with the renderer.
