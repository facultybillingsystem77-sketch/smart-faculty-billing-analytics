import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  GraduationCap, 
  Users, 
  BarChart3, 
  Receipt, 
  Shield,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary rounded-full">
              <GraduationCap className="h-16 w-16 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-4">
            Smart Faculty Billing & Analytics System
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            A comprehensive solution for managing faculty records, processing salary billing, 
            and visualizing analytics with powerful insights.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="gap-2">
                Get Started <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-16">
          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle>Secure Authentication</CardTitle>
              <CardDescription>
                JWT-based authentication with role-based access control for admin and faculty
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>Faculty Management</CardTitle>
              <CardDescription>
                Complete CRUD operations for managing faculty records, departments, and designations
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Receipt className="h-10 w-10 text-purple-600 mb-2" />
              <CardTitle>Billing System</CardTitle>
              <CardDescription>
                Process salary billing with allowances, deductions, and generate PDF salary slips
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-orange-600 mb-2" />
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                Visualize salary trends, department comparisons, and workload distribution
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Key Features List */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-2xl">Key Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Admin Dashboard</p>
                    <p className="text-sm text-muted-foreground">
                      Comprehensive overview with faculty statistics and system metrics
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Faculty Portal</p>
                    <p className="text-sm text-muted-foreground">
                      View profile, workload details, and download salary slips
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Real-time Analytics</p>
                    <p className="text-sm text-muted-foreground">
                      Interactive charts showing salary trends and department insights
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">PDF Generation</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically generate professional salary slips with detailed breakdowns
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Password Reset</p>
                    <p className="text-sm text-muted-foreground">
                      Email-based password recovery with secure token validation
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Responsive Design</p>
                    <p className="text-sm text-muted-foreground">
                      Works seamlessly across desktop, tablet, and mobile devices
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card className="bg-primary/5">
          <CardHeader>
            <CardTitle>Demo Credentials</CardTitle>
            <CardDescription>Use these credentials to explore the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 bg-card rounded-lg border">
                <p className="font-semibold mb-2">Admin Access</p>
                <p className="text-sm text-muted-foreground">
                  Email: <span className="font-mono">admin@faculty.edu</span><br />
                  Password: <span className="font-mono">admin123</span>
                </p>
              </div>
              <div className="p-4 bg-card rounded-lg border">
                <p className="font-semibold mb-2">Faculty Access</p>
                <p className="text-sm text-muted-foreground">
                  Email: <span className="font-mono">john.smith@faculty.edu</span><br />
                  Password: <span className="font-mono">faculty123</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 Smart Faculty Billing System. Built with Next.js, TypeScript, and shadcn/ui.</p>
        </div>
      </footer>
    </div>
  );
}