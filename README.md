# Mirabilis Data API & CMS

This project was built with [Lovable](https://lovable.dev).

## Production Cloudflare R2 Media Upload Setup (Vercel)

To avoid Vercel Serverless Function payload limit (4.5 MB `Content Too Large` 413 error) on production uploads, large images and videos are uploaded directly from the browser to Cloudflare R2 using presigned URLs.

### 1. Create a Cloudflare R2 Bucket

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com) -> **R2 Object Storage**.
2. Create a bucket (e.g. `mirabilis-media`).
3. Connect a custom domain or enable the public R2.dev bucket domain (e.g. `https://media.mirabilisbyt.in`).

### 2. Configure CORS on Cloudflare R2 Bucket

Go to your R2 Bucket Settings -> **CORS Policy** and add:

```json
[
  {
    "AllowedOrigins": ["https://mirabilisbyt.in", "http://localhost:8080", "http://localhost:5173"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### 3. Generate R2 API Token Credentials

1. Under Cloudflare R2 -> **Manage R2 API Tokens**, create an API token with **Object Read & Write** permissions scoped to your bucket.
2. Note down the **Account ID**, **Access Key ID**, and **Secret Access Key**.

### 4. Set Environment Variables in Vercel

In your Vercel Dashboard -> **Settings** -> **Environment Variables**, set:

```env
STORAGE_DRIVER=r2
R2_ACCOUNT_ID=<your-cloudflare-account-id>
R2_BUCKET=mirabilis-media
R2_ACCESS_KEY_ID=<your-r2-access-key-id>
R2_SECRET_ACCESS_KEY=<your-r2-secret-access-key>
R2_PUBLIC_BASE_URL=https://media.mirabilisbyt.in
MONGODB_URI=mongodb+srv://<username>:<password>@mirabilis.sc5wiil.mongodb.net/?appName=Mirabilis
DB_NAME=mirabilis
```

---

## Local Development

Prefer working locally? You need Node.js, npm, and Python.

```sh
# Frontend
npm i
npm run dev
```

```sh
# Backend
cd backend
py -m pip install -r requirements.txt
py -m uvicorn app.main:app --reload --port 8000
```

**Tests / lint:**

```sh
cd backend
py -m pytest
```
