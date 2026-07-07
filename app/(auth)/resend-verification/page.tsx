'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ResendVerificationPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await res.json();
      if (res.ok) {
        setMessage(result.message);
      } else {
        setError(result.error || 'Something went wrong');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-2">Resend Verification Email</h1>
      <p className="text-sm text-muted-foreground text-center mb-6">
        Enter your email and we&apos;ll send a new verification link.
      </p>

      {message && (
        <div className="bg-primary/10 text-primary p-3 rounded-md mb-4 text-sm">{message}</div>
      )}
      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4 text-sm">{error}</div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Sending...' : 'Send Verification Email'}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Back to{' '}
        <Link href="/login" className="text-primary hover:underline">Log in</Link>
      </p>
    </div>
  );
}
