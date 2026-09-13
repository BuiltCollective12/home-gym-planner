# Product photos

Drop a real product photo here named after the equipment id from
`src/lib/catalog.ts`, and it replaces the generated 3D thumbnail everywhere
(catalog sidebar, cart rows) with no code change.

    public/products/titan-t3-power-rack.jpg
    public/products/concept2-rowerg.png
    public/products/flybird-adjustable-bench.webp

Accepted extensions, tried in this order: jpg, jpeg, png, webp, avif.
Square-ish images on a white or transparent background look best at 44-56px.

## Where these may legally come from

- **Manufacturer media / press kits** — available now. Most brands (Titan, CAP,
  Bowflex, Concept2, Sunny, Valor) publish product photography for retail and
  affiliate partners, or will send it on request.
- **Amazon Product Advertising API** — the only compliant source for Amazon's
  own listing images, gated behind an approved Associates account plus three
  qualifying sales. Once live, images come through automatically.
- **Photos we take or commission.**

## What is not allowed

Scraping or hotlinking `m.media-amazon.com` image URLs outside PA-API. It
breaches the Associates Operating Agreement and the brands' copyright, and the
penalty is losing the Associates account. Amazon removed image-link generation
from SiteStripe in 2024, so there is no manual workaround.
