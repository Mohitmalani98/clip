
"use client";

import { useState, useEffect } from 'react';

// Mock user data - replace with actual data fetching
const mockUser = {
  name: 'Test User',
  subscription: {
    status: 'Active',
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toDateString(), // 30 days from now
  },
};

export default function DashboardPage() {
  const [user, setUser] = useState(mockUser);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Here you would typically fetch user data from your API
    // For now, we're using mock data.
  }, []);

  if (!isMounted) {
    return null; // or a loading spinner
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-md w-full bg-card p-8 rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary">Welcome, {user.name}</h1>
          <p className="text-muted-foreground">Here is your subscription status.</p>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Subscription Status:</span>
            <span
              className={`px-3 py-1 text-sm font-semibold rounded-full ${
                user.subscription.status === 'Active'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {user.subscription.status}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Expires On:</span>
            <span className="text-muted-foreground">{user.subscription.expires}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
