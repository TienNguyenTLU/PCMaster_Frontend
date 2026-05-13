# Authentication Implementation - PCMaster Frontend

## Overview
This document outlines the authentication system implemented for the PCMaster frontend, including login, signup, and role-based routing.

## System Architecture

### Files Structure
```
app/
├── auth/
│   ├── login/
│   │   └── page.tsx           # Login page
│   └── signup/
│       └── page.tsx           # Signup page
├── dashboard/
│   └── page.tsx               # Admin dashboard (protected)
├── layout.tsx                 # Root layout with AuthProvider
├── page.tsx                   # Home page (redirects to home-content)
├── home-content.tsx           # Home page content (responsive UI)
├── providers.tsx              # Auth context provider
├── globals.css                # Global styles
└── favicon.ico

lib/
├── api.ts                     # API service for auth endpoints
└── store.ts                   # Zustand auth store

middleware.ts                  # Next.js middleware for route protection
.env.example                   # Environment variables template
```

## Key Features

### 1. Authentication Flow
1. **Signup**: User creates account → API registers → Auth store saves token & user → Redirect to home
2. **Login**: User enters credentials → API authenticates → Auth store saves token & user → Redirect based on role
   - ADMIN role → `/dashboard`
   - CUSTOMER role → `/`
   - No auth → `/`

### 2. State Management (Zustand)
- Global auth store with persistence to localStorage
- Actions: `login`, `signup`, `logout`, `clearError`, `hydrate`
- Automatic hydration on app load

### 3. Protected Routes
- Dashboard `/dashboard`: Only ADMIN users can access
- Auth pages `/auth/login`, `/auth/signup`: Redirects to home if already authenticated

### 4. API Integration
Base URL: `http://localhost:8080/api` (configurable via `NEXT_PUBLIC_API_URL`)

Endpoints:
- `POST /auth/login`: Returns token and user data
- `POST /auth/register`: Returns token and user data

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### 3. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

### Component Examples

#### Using Auth Store
```typescript
'use client';

import { useAuthStore } from '@/lib/store';

export function MyComponent() {
  const { user, login, logout, isLoading } = useAuthStore();

  return (
    <div>
      {user ? (
        <>
          <p>Welcome, {user.fullName}</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <button onClick={() => login(email, password)}>Login</button>
      )}
    </div>
  );
}
```

### Routing Logic

#### Automatic Redirects After Auth
```typescript
// In Login page
const { login, user } = useAuthStore();

await login(email, password);
const currentUser = useAuthStore.getState().user;

if (currentUser?.role === 'ADMIN') {
  router.push('/dashboard');  // ADMIN route
} else {
  router.push('/');           // CUSTOMER/default route
}
```

#### Protected Dashboard
```typescript
useEffect(() => {
  if (!user) {
    router.push('/auth/login');
    return;
  }

  if (user.role !== 'ADMIN') {
    router.push('/');
    return;
  }
}, [user, router]);
```

## Authentication Data Structure

### User Object
```typescript
interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'CUSTOMER';
}
```

### Auth Store State
```typescript
interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  
  login: (email: string, password: string) => Promise<void>;
  signup: (fullName: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  hydrate: () => void;
}
```

## UI Components

### 1. Login Page (`/auth/login`)
- Modern gradient design with decorative elements
- Email and password fields with validation
- Error message display
- Links to signup and guest access
- Responsive design for mobile and desktop

### 2. Signup Page (`/auth/signup`)
- Similar design to login page
- Fields: Full Name, Email, Password, Confirm Password
- Password confirmation validation
- Terms of service links
- Links to login

### 3. Dashboard (`/dashboard`)
- Admin-only access
- User information display
- Admin feature cards (Products, Orders, Users, etc.)
- Logout button

### 4. Home Page (`/`)
- Responsive hero section
- Authentication-aware navigation
  - If logged in: Show user info and logout button
  - If not logged in: Show sign up and sign in links
- Feature showcase
- CTA sections
- Call-to-action adapted based on auth state

## Form Validation

### Technology: Zod
- Runtime schema validation
- Type-safe validation errors
- Custom error messages

### Login Validation
```typescript
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
```

### Signup Validation
```typescript
const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords don\'t match',
  path: ['confirmPassword'],
});
```

## Error Handling

1. **API Errors**: Caught and stored in `error` state
2. **Validation Errors**: Zod validation with field-level error display
3. **User Feedback**: Error messages displayed in red alert boxes
4. **Error Clearing**: Manual `clearError()` or automatically on field change

## Storage

### LocalStorage Keys
- `authToken`: JWT token for API requests
- `user`: Serialized user object
- `auth-store`: Full Zustand store persistence

### Session Persistence
Auth state persists across page reloads via localStorage and Zustand middleware.

## Security Considerations

1. **Token Storage**: Tokens stored in localStorage (consider httpOnly cookies for production)
2. **Password Handling**: Passwords only sent via HTTPS to backend
3. **API Protection**: Include token in Authorization header for protected endpoints
4. **Role-Based Access**: Client-side checks supplemented by server-side authorization

## Future Enhancements

1. Add refresh token mechanism
2. Implement logout on other tabs
3. Add social authentication (Google, GitHub)
4. Implement password reset flow
5. Add two-factor authentication
6. Use httpOnly cookies for token storage
7. Add Remember Me functionality
8. Implement role-based middleware

## API Integration Notes

### Request Format
```typescript
const response = await fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ email, password }),
});
```

### Response Format
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "User Name",
    "role": "ADMIN" | "CUSTOMER"
  }
}
```

## Troubleshooting

### User Not Persisting After Refresh
- Ensure `AuthProvider` is wrapping app content in `layout.tsx`
- Check that `hydrate()` is being called on component mount
- Verify localStorage is not disabled

### Token Not Being Sent to API
- Update protected API calls to include token in headers:
```typescript
headers: {
  'Authorization': `Bearer ${token}`,
}
```

### Dashboard Access Denied
- Verify user role is "ADMIN" in auth store
- Check role value matches exactly (case-sensitive)
- Clear browser cache and localStorage if needed

## Testing

### Login Flow
1. Go to `/auth/login`
2. Enter test credentials
3. Should redirect to `/` if CUSTOMER or `/dashboard` if ADMIN
4. User info should display in navigation

### Signup Flow
1. Go to `/auth/signup`
2. Fill in all fields
3. Should redirect to `/` after successful signup
4. User should be automatically logged in

### Logout Flow
1. Click logout button when logged in
2. User state should clear
3. Navigation should show login/signup links
4. Redirect to `/` should occur

### Protected Routes
1. Try accessing `/dashboard` without being logged in
2. Should redirect to `/auth/login`
3. Try accessing `/dashboard` as CUSTOMER
4. Should redirect to `/`
