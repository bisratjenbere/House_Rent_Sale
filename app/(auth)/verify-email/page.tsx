'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');
  
  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }
    
    // The API redirects to /login?verified=true on success, or returns JSON error
    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`, {
          redirect: 'manual', // Don't follow redirect — detect it ourselves
        });

        if (response.type === 'opaqueredirect' || response.status === 0) {
          // Success: API redirected — navigate the browser to login
          window.location.href = '/login?verified=true';
          return;
        }

        const result = await response.json();
        if (response.ok) {
          window.location.href = '/login?verified=true';
        } else {
          setStatus('error');
          setMessage(result.error || 'Verification failed');
        }
      } catch (err) {
        setStatus('error');
        setMessage('An unexpected error occurred');
      }
    };

    verifyEmail();
  }, [searchParams]);
  
  return (
    <div className="bg-card p-8 rounded-lg shadow-md text-center">
      <h1 className="text-2xl font-bold mb-6">Email Verification</h1>
      
      {status === 'loading' && (
        <div>
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying your email...</p>
        </div>
      )}
      
      {status === 'success' && (
        <div>
          <div className="bg-primary/10 text-primary p-4 rounded-md mb-6">
            <p>{message}</p>
          </div>
          <Link
            href="/login"
            className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90"
          >
            Go to Login
          </Link>
        </div>
      )}
      
      {status === 'error' && (
        <div>
          <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
            <p>{message}</p>
          </div>
          <div className="space-y-3">
            <Link
              href="/login"
              className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90"
            >
              Go to Login
            </Link>
            <p className="text-sm text-muted-foreground">
              Need a new verification link?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Resend verification email
              </Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="bg-card p-8 rounded-lg shadow-md text-center">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
