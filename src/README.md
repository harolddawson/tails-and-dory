# Tails & Dory — Site README

## File structure

```
pom-site/
├── index.html        ← Home page
├── tails.html        ← Tails memorial page
├── dory.html         ← Dory profile page
├── stories.html      ← Blog / stories listing
├── photos.html       ← Combined photo gallery
├── css/
│   └── style.css     ← ALL styles + theme variables
├── js/
│   └── main.js       ← Nav, lightbox, scroll animations
└── photos/           ← Upload your images here
    ├── tails-hero.jpg
    ├── dory-hero.jpg
    └── (more photos...)
```

---

## Deploying to AWS (S3 + CloudFront + ACM)

### 1. Create an S3 bucket

```bash
aws s3 mb s3://your-domain-name --region us-east-1
```

Enable static website hosting:
```bash
aws s3 website s3://your-domain-name \
  --index-document index.html \
  --error-document index.html
```

Set the bucket policy (replace `your-domain-name`):
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::your-domain-name/*"
  }]
}
```

### 2. Upload the site

```bash
aws s3 sync ./pom-site/ s3://your-domain-name/ \
  --delete \
  --cache-control "max-age=86400"
```

For the CSS/JS (cache bust when you update):
```bash
aws s3 cp css/style.css s3://your-domain-name/css/style.css \
  --cache-control "max-age=31536000, immutable"
```

### 3. Request a certificate in ACM

- Go to AWS Certificate Manager → Request certificate
- Add your domain(s): `yourdomain.com`, `www.yourdomain.com`
- Choose DNS validation → create the CNAME records in Route 53 (ACM can do this automatically)
- Wait for status = Issued

### 4. Create a CloudFront distribution

- Origin: your S3 bucket website endpoint (`your-domain-name.s3-website-us-east-1.amazonaws.com`)
- Viewer protocol policy: Redirect HTTP to HTTPS
- Alternate domain names (CNAMEs): `yourdomain.com`, `www.yourdomain.com`
- SSL certificate: choose the ACM cert you just created
- Default root object: `index.html`

### 5. Point Route 53 to CloudFront

- In Route 53, create an A record for `yourdomain.com`
- Type: A — Alias → CloudFront distribution
- Repeat for `www` if needed

---

## Adding content

### Adding photos

1. Upload images to the `photos/` folder in S3
2. In `tails.html` or `dory.html`, replace the placeholder `<div class="photo-placeholder">` with:
```html
<div class="photo-grid-item" data-lightbox="photos/your-photo.jpg">
  <img src="photos/your-photo.jpg" alt="Tails — brief description" loading="lazy" />
</div>
```
3. Do the same in `photos.html`, adding `data-dog="tails"` or `data-dog="dory"` for filtering.

### Adding a story

1. Create a new HTML file, e.g. `story-2024-summer.html`
   (Copy the structure from tails.html — header, nav, content section, footer)
2. In `stories.html`, copy one of the `<article class="blog-card">` blocks, fill in the
   date, title, excerpt, and set `href="story-2024-summer.html"`.
3. Set `data-dog="tails"` / `"dory"` / `"both"` on the article element.

### Retheming colors

Open `css/style.css` and edit the `:root {}` block at the top.
Every color in the site is a CSS variable — change them there, they update everywhere.

---

## Live age display

`dory.html` includes a small JavaScript snippet that calculates Dory's current age in
years and months and updates it live in the browser. No maintenance needed.
