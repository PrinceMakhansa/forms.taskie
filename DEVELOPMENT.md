# Development Guide

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Discord OAuth application credentials
- Git (optional)

### 1. Environment Setup

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

**Required Environment Variables:**

- `MONGODB_URI` — MongoDB connection string (MongoDB Atlas)
- `NEXTAUTH_SECRET` — Random secret for NextAuth sessions
- `NEXTAUTH_URL` — Application URL (http://localhost:3000 for dev)
- `DISCORD_CLIENT_ID` — Discord OAuth app client ID
- `DISCORD_CLIENT_SECRET` — Discord OAuth app client secret

**Optional Environment Variables:**

- `ADMIN_DISCORD_IDS` — Comma-separated Discord user IDs for admin access (for bot role checking in future)

### 2. Starting Development Server

```bash
npm run dev
```

Server runs on [http://localhost:3000](http://localhost:3000)

### 3. Building for Production

```bash
npm run build
npm start
```

## Architecture

### Directory Structure

```
taskie-forms/
├── pages/                          # Next.js pages and API routes
│   ├── api/
│   │   ├── auth/[...nextauth].ts   # NextAuth configuration
│   │   ├── forms/
│   │   │   ├── index.ts            # List/create forms
│   │   │   ├── [id].ts             # Get/update/delete form
│   │   │   └── [id]/submit.ts      # Handle form submissions
│   │   └── ...
│   ├── forms/[id].tsx              # Public form page
│   ├── admin/
│   │   ├── index.tsx               # Admin dashboard
│   │   └── forms/[id].tsx          # Form editor & responses
│   ├── _app.tsx                    # App wrapper with NextAuth provider
│   └── index.tsx                   # Home page
├── components/                     # Reusable React components
│   ├── Layout.tsx                  # Main layout with nav/footer
│   ├── FormContainer.tsx           # Form wrapper
│   ├── FormField.tsx               # Individual field component
│   ├── FormBuilder.tsx             # Form editor component
│   ├── Button.tsx                  # Styled button
│   └── ...
├── lib/                            # Utility functions
│   ├── db.ts                       # MongoDB connection helper
│   ├── auth.ts                     # Auth utilities & middleware
│   └── validation.ts               # Zod schemas
├── models/                         # Mongoose schemas
│   ├── Form.ts                     # Form document schema
│   ├── Submission.ts               # Submission document schema
│   └── ...
├── styles/                         # Global CSS
│   └── globals.css                 # Tailwind & custom styles
├── .env.example                    # Environment variables template
├── .env.local                      # Local environment variables (gitignored)
├── tailwind.config.js              # Tailwind configuration
├── next.config.js                  # Next.js configuration
├── tsconfig.json                   # TypeScript configuration
└── package.json                    # Project metadata & scripts
```

### Technology Stack

- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS (white theme with warm grays)
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: NextAuth (Discord OAuth)
- **Validation**: Zod
- **HTTP Client**: Axios, SWR
- **Deployment**: Vercel-ready

## Key Features

### Forms API

**Create Form** (POST `/api/forms`)
```typescript
{
  title: "Feedback Form",
  description: "Share your feedback",
  fields: [
    {
      id: "name",
      type: "text",
      label: "Full Name",
      required: true,
      order: 0
    },
    {
      id: "email",
      type: "email",
      label: "Email Address",
      required: true,
      order: 1
    }
  ]
}
```

**Submit Form** (POST `/api/forms/:id/submit`)
```typescript
{
  name: "John Doe",
  email: "john@example.com"
}
```

### Authentication Flow

1. User clicks "Sign In" → Discord OAuth login
2. NextAuth creates session in database
3. Session stored in httpOnly cookie
4. API routes check session for protected endpoints
5. Admin check via `isAdmin()` helper (placeholder for bot role checks)

### Validation

All API routes use Zod schemas for request validation:
- Form creation validates field structure
- Submissions validated against form fields
- Type-specific validation (email, date, select options)

## Styling Guide

### Color Palette

- **White**: `#ffffff` (main background)
- **Warm Gray**: `#fafaf9` to `#1c1917` (accents & text)
- **Primary**: Blue (`blue-600`) for CTAs
- **Danger**: Red (`red-600`) for destructive actions

### Component Patterns

Tailwind utilities for consistent styling:
- Rounded corners: `rounded-lg`
- Shadows: `shadow-soft`, `shadow-soft-lg`
- Spacing: Standard Tailwind scale (px-4, py-2, etc.)
- Responsive: Mobile-first (`sm:`, `md:`, `lg:` breakpoints)

## Database Models

### Form Schema

```typescript
{
  title: String,
  description?: String,
  fields: Array,
  createdBy: String,
  isPublished: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

Indices:
- `{ createdBy: 1, createdAt: -1 }`
- `{ isPublished: 1 }`

### Submission Schema

```typescript
{
  formId: ObjectId,
  data: Object,
  submittedAt: Date,
  ipAddress?: String
}
```

Indices:
- `{ formId: 1, submittedAt: -1 }`
- `{ submittedAt: -1 }`

## Common Tasks

### Adding a New Field Type

1. Update `FIELD_TYPES` in `components/FormBuilder.tsx`
2. Add rendering in `components/FormField.tsx`
3. Add validation in `pages/api/forms/[id]/submit.ts`
4. Update Zod schema in `lib/validation.ts` if needed

### Creating Protected API Routes

```typescript
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = (session.user as any).id;
  // ... rest of handler
}
```

### Querying Forms

```typescript
import Form from '@/models/Form';
import connectToMongo from '@/lib/db';

await connectToMongo();
const forms = await Form.find({ createdBy: userId })
  .sort({ createdAt: -1 });
```

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Connect repository in Vercel dashboard
3. Add environment variables:
   - `MONGODB_URI`
   - `NEXTAUTH_SECRET` (generate new)
   - `NEXTAUTH_URL` (your Vercel domain)
   - `DISCORD_CLIENT_ID`
   - `DISCORD_CLIENT_SECRET`
4. Deploy

### MongoDB Atlas Setup

1. Create MongoDB Atlas account
2. Create cluster
3. Add IP whitelist (or allow all for testing)
4. Create database user
5. Copy connection string to `MONGODB_URI`

### Environment Variables on Vercel

Update `NEXTAUTH_URL` to your production domain (no trailing slash):
```
NEXTAUTH_URL=https://your-domain.vercel.app
```

## Troubleshooting

### "MongoDB connection refused"
- Verify `MONGODB_URI` is correct
- Check IP whitelist on MongoDB Atlas
- Ensure network connectivity

### "Discord OAuth failed"
- Verify client ID and secret
- Check redirect URI matches Discord app settings
- Ensure `NEXTAUTH_SECRET` is set

### "TypeError: Cannot read property 'user' of null"
- Session not established → user not authenticated
- Check NextAuth configuration
- Verify session cookies are enabled

### "Validation failed" on form submission
- Check field IDs match form definition
- Verify required fields are filled
- Type validation for email/date fields

## Future Enhancements

- [ ] MongoDB session store (replace memory store)
- [ ] Discord bot role verification for admin access
- [ ] Form statistics and analytics dashboard
- [ ] Webhook integrations for submissions
- [ ] Email notifications on new submissions
- [ ] CSV export of submissions
- [ ] Form templates library
- [ ] Conditional field logic
- [ ] File upload support
- [ ] Rate limiting on submissions
