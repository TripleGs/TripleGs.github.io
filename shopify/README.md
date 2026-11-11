# Natalie's Journal — links page (Shopify)

The pieces behind **nataliesjournal.com/pages/links**: the floating bubbles and
scissors that also run the Natalie section on josephgoss.com, packaged as a
Shopify theme section. This folder is kept off josephgoss.com itself
(`_config.yml` excludes it).

| File | Goes in the theme as | What it is |
|---|---|---|
| `nj-links.liquid` | `sections/nj-links.liquid` | The section ("Natalie's links" in the theme editor). Generated — don't edit by hand. |
| `page.links.json` | `templates/page.links.json` | The page template that puts the section on a page. |
| `nj-links.template.liquid` | — | The section's markup and settings, with the shared CSS/JS left out. |
| `build.py` | — | Builds `nj-links.liquid` from the template plus `../njl.css` and `../njl.js`. |

## After changing the bubbles or scissors

They live in `njl.css` / `njl.js` at the repo root, shared with josephgoss.com.
Rebuild the Shopify copy, then paste it over the theme's `sections/nj-links.liquid`:

```sh
python3 shopify/build.py
```

## Setting it up on a theme

1. **Online Store → Themes → ⋯ → Edit code.** Right-click **sections** → **New file…** →
   `nj-links.liquid`; paste in `nj-links.liquid`; Save.
2. Right-click **templates** → **New file…** → `page.links.json`; paste in
   `page.links.json`; Save.
3. **Online Store → Pages → Add page.** Title "Links", no content, **Theme template:
   links**, Save. It's live at `/pages/links`.
4. Text, buttons, socials, style and the travel-app link are all editable under
   **Edit theme** on that page.
