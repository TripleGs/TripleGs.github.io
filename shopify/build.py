"""Build nj-links.liquid (the Shopify section for nataliesjournal.com/pages/links)
from its template plus the shared bubbles & scissors component, which also runs
the Natalie section on josephgoss.com.

    python3 shopify/build.py

Reads:  shopify/nj-links.template.liquid
        njl.css, njl.js            (the repo root — the same files josephgoss.com uses)
Writes: shopify/nj-links.liquid    — paste into the theme's sections/nj-links.liquid

shopify/page.links.json is the page template that uses the section — it goes in
the theme's templates/ folder (see README.md here).
"""
from pathlib import Path

HERE = Path(__file__).resolve().parent
SITE = HERE.parent

template = (HERE / "nj-links.template.liquid").read_text()
css = (SITE / "njl.css").read_text()
js = (SITE / "njl.js").read_text()

# The CSS and JS sit inside {% raw %} blocks, so Liquid leaves them alone; a
# stray "{% endraw %}" inside them would end that early.
for name, text in (("njl.css", css), ("njl.js", js)):
    if "endraw" in text:
        raise SystemExit(f"{name} contains 'endraw', which would break the {{% raw %}} block")

for marker in ("/*NJL_CSS*/", "/*NJL_JS*/"):
    if template.count(marker) != 1:
        raise SystemExit(f"expected exactly one {marker} in the template")

out = template.replace("/*NJL_CSS*/", css.strip()).replace("/*NJL_JS*/", js.strip())
(HERE / "nj-links.liquid").write_text(out)
print(f"wrote shopify/nj-links.liquid ({len(out):,} bytes)")
