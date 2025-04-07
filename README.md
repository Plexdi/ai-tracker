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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Firebase Database Rules

This application uses Firebase Realtime Database for storing workout data, user messages, and program information. The database rules need to be configured to:

1. Secure data access to authenticated users only
2. Set up proper indexes for queries (`indexOn`)

### Setting Up Firebase Rules

The required database rules are defined in `firebase/database.rules.json`. These rules include the necessary `.indexOn` for collections that are queried by timestamp or date.

To deploy these rules:

1. Install the Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize Firebase (if needed): `firebase init`
4. Deploy the rules: `firebase deploy --only database`

Alternatively, you can manually copy the rules from `firebase/database.rules.json` to the Firebase Console under Realtime Database > Rules.

### Important Indexes

The rules include necessary indexes for:
- `users/{userId}/messages` (indexed by `createdAt`)
- `users/{userId}/programs` (indexed by `createdAt`)
- `workouts/{userId}` (indexed by `date` and `createdAt`)
- `customExercises/{userId}` (indexed by `createdAt`)

These indexes are required to prevent the error: `Index not defined, add ".indexOn": "createdAt"` when querying data.
