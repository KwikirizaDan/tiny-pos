# TinyPOS - Supabase Setup Instructions

TinyPOS uses Supabase as its backend for Database, Authentication, and Storage.

## 1. Create a Supabase Project
1. Go to [Supabase](https://supabase.com/) and create a new project.
2. Once the project is created, go to **Project Settings > API**.

## 2. Configure Environment Variables
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Fill in the following variables using your Supabase API settings:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Project URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your `anon` public key.

## 3. Database Migration
1. In your Supabase dashboard, go to the **SQL Editor**.
2. Click **New query**.
3. Copy the entire content of `supabase_schema.sql` (found in the root of this project) and paste it into the editor.
4. Run the query. This will:
   - Create all necessary tables and enums.
   - Set up Indexes for performance.
   - Enable Row Level Security (RLS) and set up access policies.

## 4. Authentication Setup
1. Go to **Authentication > Providers**.
2. Ensure **Email** is enabled.
3. In **Authentication > URL Configuration**, set the Site URL to `http://localhost:3000` (or your production URL).
4. Add `http://localhost:3000/auth/callback` to the Redirect URLs.

## 5. Storage Setup
1. Go to **Storage**.
2. Create a new bucket named `products`.
3. Set the bucket to **Public**.
4. (Optional) Create a policy to allow authenticated users to upload files to the `products` bucket.

## 6. Run the Application
```bash
npm install
npm run dev
```
The app will automatically handle vendor creation upon your first sign-in.
