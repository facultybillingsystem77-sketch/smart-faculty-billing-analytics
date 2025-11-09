"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { loginUser } from '@/lib/auth';
import { Loader2, GraduationCap } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await loginUser(email, password);

      // Redirect based on role
      if (data.user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/faculty/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 !bg-red-100">
      <Card className="shadow-xl !w-6/12 !h-[495px] !max-w-[50%] !bg-white">
        <CardHeader className="space-y-1 text-center !bg-white">
          <div className="flex justify-center mb-2 !bg-gray-100">
            <div className="p-3 bg-primary rounded-full">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold !bg-gray-200">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to Smart Faculty Billing System
          </CardDescription>
        </CardHeader>
        <CardContent className="!w-[99.6%] !h-[344px] !bg-transparent">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error &&
            <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            }
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@faculty.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading} className="!bg-slate-50" />

            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading} />

            </div>

            <div className="flex items-center justify-between text-sm">
              <Link
                href="/reset-password"
                className="text-primary hover:underline">

                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}>

              {loading ?
              <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </> :

              'Sign In'
              }
            </Button>

            <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
              <p className="font-semibold mb-2">Demo Credentials:</p>
              <p className="text-muted-foreground">
                Admin: admin@faculty.edu / admin123<br />
                Faculty: john.smith@faculty.edu / faculty123
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>);

}