import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User } from '@/models';

// Pre-generated at module load to avoid hardcoded hash and amortize bcrypt cost
const dummyHashPromise = bcrypt.hash('dummy-timing-placeholder', 10);

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  pages: {
    signIn: '/login',
    error: '/login',
  },
  
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }
        
        await connectDB();
        
        // Find user by email
        const user = await User.findOne({ email: credentials.email.toLowerCase() }).select('+password');
        
        // Timing attack prevention: always compare a password even if user doesn't exist
        const passwordToCompare = user?.password || (await dummyHashPromise);
        
        // Compare password
        const isValid = await bcrypt.compare(credentials.password, passwordToCompare);
        
        if (!user || !isValid) {
          throw new Error('Invalid email or password');
        }
        
        // D17: Check if email is verified
        if (!user.emailVerified) {
          throw new Error('Please verify your email address before logging in. Check your inbox or request a new verification email.');
        }
        
        // Return user data to be encoded in JWT
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  
  callbacks: {
    async jwt({ token, user }) {
      // On sign in, add user data to token
      if (user) {
        token.userId = user.id;
        token.role = user.role;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    
    async session({ session, token }) {
      // Add user data to session from token
      if (token && session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  
  secret: process.env.NEXTAUTH_SECRET,
};
