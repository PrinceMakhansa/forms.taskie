# Taskie Forms Portal

A Next.js TypeScript application for creating, managing, and submitting forms with a modern white theme. Features MongoDB persistence, Discord OAuth authentication, and a responsive admin dashboard.

## Features

- **Google Forms-style Builder** — Visual drag-and-drop form builder with field cards
- **Form Rendering** — Public pages for form completion and submission
- **Admin Dashboard** — Manage forms, publish/unpublish, view submissions
- **Discord Authentication** — NextAuth with Discord OAuth provider
- **MongoDB Integration** — Mongoose models for forms and submissions
- **Responsive Design** — Tailwind CSS with cozy white theme
- **Type Safety** — Full TypeScript support

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB Community Edition, then:
mongod --dbpath /path/to/data
```

**Option B: MongoDB Atlas (Free)**
1. Create account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get connection string from "Connect" > "Drivers"

### 3. Set Up Discord OAuth

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and name it
3. Go to **OAuth2 > General**
4. Add Redirect URL: `http://localhost:3000/api/auth/callback/discord`
5. Copy the **Client ID** and **Client Secret**

### 4. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# MongoDB (use your connection string)
MONGODB_URI=mongodb://localhost:27017/taskie-forms

# NextAuth (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your-random-secret-here
NEXTAUTH_URL=http://localhost:3000

# Discord OAuth (from step 3)
DISCORD_CLIENT_ID=your-client-id
DISCORD_CLIENT_SECRET=your-client-secret

# Admin IDs (optional - leave empty for dev mode where all users are admins)
ADMIN_DISCORD_IDS=
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
taskie-forms/
├── pages/
│   ├── api/
│   │   ├── auth/[...nextauth].ts      # NextAuth configuration
│   │   ├── forms/
│   │   │   ├── index.ts               # GET /api/forms, POST /api/forms
│   │   │   ├── [id].ts                # GET/PUT/DELETE /api/forms/:id
│   │   │   └── [id]/submit.ts         # POST /api/forms/:id/submit
│   │   └── ...
│   ├── forms/
│   │   └── [id].tsx                   # Public form page
│   ├── admin/
│   │   ├── index.tsx                  # Admin dashboard
│   │   └── forms/[id].tsx             # Form management & submissions
│   ├── _app.tsx                       # Next.js app wrapper
│   └── ...
├── components/
│   ├── Layout.tsx                     # Main layout component
│   ├── FormContainer.tsx              # Form container wrapper
│   ├── FormField.tsx                  # Individual form field
│   ├── FormBuilder.tsx                # Form creation/editing
│   ├── Button.tsx                     # Button component
│   └── ...
├── lib/
│   ├── db.ts                          # MongoDB connection helper
│   ├── auth.ts                        # Authentication utilities
│   └── ...
├── models/
│   ├── Form.ts                        # Form schema
│   ├── Submission.ts                  # Submission schema
│   └── ...
├── styles/
│   └── globals.css                    # Global Tailwind styles
├── .env.example                       # Environment variables template
├── tailwind.config.js                 # Tailwind configuration
├── next.config.js                     # Next.js configuration
├── tsconfig.json                      # TypeScript configuration
└── package.json                       # Project metadata & scripts
```

## Development Scripts

- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm start` — Start production server
- `npm run lint` — Run ESLint

## API Routes

### Forms CRUD

- `GET /api/forms` — List all forms (admin only)
- `POST /api/forms` — Create new form (admin only)
- `GET /api/forms/:id` — Get form details
- `PUT /api/forms/:id` — Update form (admin only)
- `DELETE /api/forms/:id` — Delete form (admin only)

### Form Submissions

- `POST /api/forms/:id/submit` — Submit form response

## Database Models

### Form

```typescript
{
  _id: ObjectId;
  title: string;
  description?: string;
  fields: FormField[];
  createdBy: string;      // Discord user ID
  createdAt: Date;
  updatedAt: Date;
  isPublished: boolean;
}
```

### Submission

```typescript
{
  _id: ObjectId;
  formId: ObjectId;
  data: Record<string, any>;
  submittedAt: Date;
  ipAddress?: string;
}
```

## Future Enhancements

- **Session Store** — Migrate to MongoDB session store or Redis
- **Role-Based Access** — Discord bot role checking via API
- **Form Analytics** — View submission statistics
- **Webhooks** — Send submissions to external services
- **Email Notifications** — Alert admins of new submissions
- **Form Templates** — Pre-built form templates
- **Conditional Fields** — Show/hide fields based on responses

## Deployment

### Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel project settings
4. Deploy

### MongoDB Atlas

1. Create a cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Generate connection string
3. Update `MONGODB_URI` in environment variables

## License

MIT
