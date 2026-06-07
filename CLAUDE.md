# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Static memorial website for two Pomeranians — Tails (deceased) and Dory. No build step for the frontend; the source files in `src/` are deployed as-is to AWS via CDK.

## Repository layout

```
src/        ← Static site (HTML/CSS/JS) — edit these files directly
cdk/        ← AWS CDK TypeScript stack — infrastructure only
```

## CDK commands (run from `cdk/`)

```bash
cd cdk
npm install          # install dependencies
npm run build        # compile TypeScript (tsc)
npx cdk synth        # synthesize CloudFormation template
npx cdk diff         # compare with deployed stack
npx cdk deploy       # deploy to AWS (account 118842417822, us-east-1)
```

## Infrastructure architecture

The CDK stack (`cdk/lib/tails-and-dory-stack.ts`) creates:
- **S3 bucket** — private (BLOCK_ALL), accessed only via CloudFront Origin Access Control
- **CloudFront distribution** — HTTPS redirect, `index.html` as default root, 403→`/index.html` for direct path access
- **BucketDeployment** — syncs `src/` (excluding `.idea`, `README.md`, `.DS_Store`) and invalidates `/*` on each deploy

Outputs: `DistributionUrl` and `DistributionId`.

Deployed resource ARNs:
- S3 bucket: `arn:aws:s3:::tailsthepom.com`
- CloudFront distribution: `arn:aws:cloudfront::118842417822:distribution/E1MT1K6T1VUPT`

## Frontend architecture

The site is plain HTML with no framework or bundler. Shared behavior lives in two files:

- **`src/css/style.css`** — all styles; colors are CSS variables in the `:root {}` block at the top — change there to retheme the whole site
- **`src/js/main.js`** — four self-contained IIFEs: mobile nav toggle, active nav link highlighting, scroll fade-in via `IntersectionObserver`, and a lightbox triggered by `data-lightbox="<src>"` attributes

### Photo gallery pattern

Photos are added via `<div class="photo-grid-item" data-lightbox="photos/your-photo.jpg">`. On `photos.html`, items also carry `data-dog="tails"` or `data-dog="dory"` for JS filtering.

### Stories pattern

Each story is a standalone HTML file. `stories.html` lists them as `<article class="blog-card">` elements with `data-dog="tails"`, `"dory"`, or `"both"`.

### Live age display

`dory.html` contains an inline `<script>` that computes Dory's current age in years and months at page load — no maintenance needed.

## Deployment workflow

**Content changes** (HTML, CSS, photos) — fast, bypasses CloudFormation:
```bash
./deploy-content.sh
```

**Infrastructure changes** (CDK stack) — slow, use only when `cdk/` files change:
```bash
cd cdk && npx cdk deploy
```

Deployed S3 bucket: `tailsanddorystack-sitebucket397a1860-4rcvpebwsizk`
CloudFront distribution ID: `E3H8PEK308HV2`
