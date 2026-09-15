# Episode Vault — Android

A real React Native + Expo Android app using Supabase and PayU Hosted Checkout.

## What is implemented
- Supabase email/password auth with persistent sessions.
- One app for user/admin roles.
- Published episode browsing.
- ₹20 PayU payment flow.
- PayU server-side hash generation and callback verification.
- Automatic purchase creation after verified PayU success.
- Private Supabase Storage video bucket and 5-minute signed playback URLs.
- Admin episode CRUD and phone-based video upload.
- Admin payment/status dashboard (no manual approval for PayU transactions).
- Standalone Android release APK build through GitHub Actions.

## Required server secrets
Set these in Supabase Edge Functions secrets:

- `PAYU_MERCHANT_KEY` = your PayU live/test merchant key
- `PAYU_SALT` = your PayU live/test salt
- `PAYU_MODE` = `test` or `live`

The Android app NEVER contains the PayU salt or Supabase service-role key.

## Storage
Create private buckets:
- `episode-videos` (private)
- `payment-screenshots` can remain for legacy/manual flow; it is not used by the PayU flow.
- Optional `episode-thumbnails` (public) if you want the admin uploader to store thumbnails.

The app stores `episodes.video_url` as a storage path such as `episode-001.mp4`, not as a public URL. The `video-url` Edge Function checks `purchases` and creates a 5-minute signed URL.

## Database migration
Run the SQL file in `supabase/migrations/202609150001_episode_vault_payu.sql` in Supabase SQL Editor. It does not drop existing tables.

## Edge Functions
Deploy:
- `create-payment`
- `payu-callback`
- `video-url`

The PayU success/failure URL is the public callback URL:
`https://vctzbxbmxckatjhijfye.supabase.co/functions/v1/payu-callback`

Configure the same callback URL in PayU webhook/notification settings where applicable. PayU recommends server-to-server verification/webhooks in addition to browser callbacks.

## GitHub build
Create GitHub repository, upload this project, then add repository Actions secrets:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL`

Run **Actions → Build Episode Vault APK → Run workflow**. The artifact is `episode-vault-release-apk` and contains `app-release.apk`.

## Important PayU setup
The project uses PayU Hosted Checkout so the app does not need a PayU merchant salt or secret. PayU's official docs require payment hashes to be generated on a server, and recommend server-side verification/webhooks before treating a payment as successful.

Before going live, replace test credentials with your live PayU key/salt and set `PAYU_MODE=live`.
