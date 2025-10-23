This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Testing

Run unit tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm test -- --coverage
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

🏗️ Architecture
Authentication Flow

Role Selection (/auth)

User chooses Ambassador or Client role

Sign Up (/auth/signup)

Creates auth account with role in metadata
Trigger creates profile entry
Redirects to onboarding

Onboarding (/onboarding/[role])

Collects role-specific information
Creates ambassador_profiles or client_profiles entry
Marks onboarding_completed = true
Redirects to dashboard

Sign In (/auth/signin)

Authenticates user
Middleware checks onboarding status
Redirects to onboarding if incomplete
Otherwise redirects to dashboard

Key Components
Supabase Clients (/utils/supabase/)

client.ts - Browser client for client components
server.ts - Server client for server components/actions
middleware.ts - Session refresh helper

Authentication (/app/auth/)

actions.ts - Server actions for auth operations
page.tsx - Role selection
signup/page.tsx - Sign up form
signin/page.tsx - Sign in form

Onboarding (/app/onboarding/)

ambassador/page.tsx - Ambassador profile setup
client/page.tsx - Client profile setup

Providers (/components/providers/)

AuthProvider.tsx - Global auth context

Middleware (/middleware.ts)

Session refresh
Onboarding enforcement
Route protection

🔐 Security Best Practices

Always use getUser() on the server - Never trust getSession() for authorization
RLS Policies - All database access is protected by your existing RLS policies
Server Actions - Authentication operations use server actions
Secure Cookies - Sessions stored in HTTP-only cookies
Automatic Refresh - Middleware refreshes expired tokens

🎯 Usage Examples
Using Auth in Components
tsx'use client'

import { useAuth } from '@/components/providers/AuthProvider'

export function MyComponent() {
const { user, profile, ambassadorProfile, clientProfile, loading } = useAuth()

if (loading) return <div>Loading...</div>

if (!user) return <div>Not authenticated</div>

return (
<div>
<p>Welcome, {user.email}</p>
<p>Role: {profile?.role}</p>
{profile?.role === 'ambassador' && ambassadorProfile && (
<p>Ambassador: {ambassadorProfile.full_name}</p>
)}
</div>
)
}
Protected Server Components
tsximport { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
const supabase = await createClient()

const { data: { user } } = await supabase.auth.getUser()

if (!user) {
redirect('/auth')
}

return <div>Protected content</div>
}
Sign Out
tsximport { signOut } from '@/app/auth/actions'

<form action={signOut}>
  <button type="submit">Sign Out</button>
</form>
📝 Important Notes
October 2025 Best Practices
This implementation follows the latest Supabase SSR package patterns:

Uses @supabase/ssr (NOT deprecated auth-helpers)
Uses getAll() and setAll() cookie methods
Avoids deprecated individual cookie operations
Implements proper middleware session refresh

Migration from Old Patterns
If migrating from @supabase/auth-helpers-nextjs:

Replace createMiddlewareClient → createServerClient
Replace createClientComponentClient → createBrowserClient
Replace createServerComponentClient → createServerClient
Update cookie handling to use getAll/setAll

Serverless Compatibility
The middleware automatically:

Refreshes expired tokens
Passes tokens to server components
Updates browser cookies
Maintains session across serverless invocations

🐛 Troubleshooting
User stuck in auth loop

Check middleware.ts matcher configuration
Verify onboarding_completed column exists
Check browser console for cookie errors

Session not persisting

Ensure middleware is running (check network tab)
Verify environment variables are correct
Check Supabase project URL includes https://

Onboarding redirect not working

Check if onboarding_completed is false in profiles table
Verify middleware is checking the correct routes
Check for errors in browser console

📚 Resources

Supabase Next.js Guide
Supabase SSR Package
Next.js 15 Documentation

🤝 Support
If you encounter issues:

Check the browser console for errors
Verify all environment variables are set
Ensure your Supabase project is running
Check that all database tables and columns exist
Review the middleware logs in development

🎉 You're All Set!
Your authentication system is now ready. The flow is:

User visits /auth → chooses role
Signs up → automatically redirected to onboarding
Completes onboarding → redirected to dashboard
If interrupted, returning users are prompted to complete onboarding
Global auth state persists throughout the app

The implementation is minimal, type-safe, and follows October 2025 best practices for Next.js 15 with Supabase.

AVOID THESE MISTAKES:
→ My number 1 pet peeve by far — adding click handlers to <div>s. This is acceptable if the right ARIA attributes and tabIndex are added, but chances are, it was done out of convenience/ignorance. Just don't do it during interviews, style the button instead

→ Not adding aria-labels for elements that don't have text, such as close buttons that are just "X"

→ Form elements don't have labels or accessible names (aria-label or aria-labelledby). Or the <label> isn't linked to the <input>

→ Headings chosen for their visual size rather than by hierarchy. DO NOT choose heading tags based on the visual size, decide base on document hierarchy and style the heading instead!

→ Poor keyboard support and focus management. Like c'mon interview questions are usually so small, it's not hard to have decent keyboard support

→ Missing alt text for <img>. Not all images need alt text, add if you aren't sure
