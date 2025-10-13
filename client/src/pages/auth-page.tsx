import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, registerSchema, type LoginData, type RegisterData } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FileText, Shield, Brain, Users, BarChart3, Loader2, Lock, Mail, User, CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import cimpleitLogo from "@assets/image_1757086402738.png";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("login");

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      firstName: "",
      lastName: "",
    },
  });

  const onLogin = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterData) => {
    registerMutation.mutate(data);
  };

  if (user) {
    return null; // Redirecting...
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800" data-testid="auth-page">
      {/* Left side - Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="w-full max-w-md space-y-6 relative z-10">
          {/* Logo and Title */}
          <div className="text-center space-y-3 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-lg opacity-50"></div>
                <img src={cimpleitLogo} alt="Cimpleit Inc Logo" className="w-12 h-12 relative z-10 drop-shadow-lg" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                LicenseIQ
              </h1>
            </div>
            <div className="flex items-center justify-center space-x-2 text-sm">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <p className="text-muted-foreground font-medium">
                AI-Powered Contract Intelligence Platform
              </p>
            </div>
          </div>

          {/* Tabs with modern styling */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
            <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg">
              <TabsTrigger 
                value="login" 
                data-testid="tab-login"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
              >
                <Lock className="h-4 w-4 mr-2" />
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                data-testid="tab-register"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
              >
                <User className="h-4 w-4 mr-2" />
                Create Account
              </TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="border-slate-200 dark:border-slate-700 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <CardHeader className="space-y-1 pb-4">
                  <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                  <p className="text-sm text-muted-foreground">Enter your credentials to access your account</p>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Username</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  placeholder="Enter your username" 
                                  {...field} 
                                  data-testid="input-username"
                                  className="pl-10 h-11 border-slate-300 dark:border-slate-600 focus-visible:ring-blue-600"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  type="password" 
                                  placeholder="Enter your password" 
                                  {...field} 
                                  data-testid="input-password"
                                  className="pl-10 h-11 border-slate-300 dark:border-slate-600 focus-visible:ring-blue-600"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold" 
                        disabled={loginMutation.isPending}
                        data-testid="button-login"
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing In...
                          </>
                        ) : (
                          <>
                            Sign In
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Register Form */}
            <TabsContent value="register" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="border-slate-200 dark:border-slate-700 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <CardHeader className="space-y-1 pb-4">
                  <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
                  <p className="text-sm text-muted-foreground">Get started with LicenseIQ today</p>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold">First Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="First name" 
                                  {...field} 
                                  data-testid="input-firstname"
                                  className="h-11 border-slate-300 dark:border-slate-600 focus-visible:ring-blue-600"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold">Last Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Last name" 
                                  {...field} 
                                  data-testid="input-lastname"
                                  className="h-11 border-slate-300 dark:border-slate-600 focus-visible:ring-blue-600"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Username</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  placeholder="Choose a username" 
                                  {...field} 
                                  data-testid="input-register-username"
                                  className="pl-10 h-11 border-slate-300 dark:border-slate-600 focus-visible:ring-blue-600"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Email (Optional)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  type="email" 
                                  placeholder="your@email.com" 
                                  {...field} 
                                  data-testid="input-email"
                                  className="pl-10 h-11 border-slate-300 dark:border-slate-600 focus-visible:ring-blue-600"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  type="password" 
                                  placeholder="Choose a password (min 6 characters)" 
                                  {...field} 
                                  data-testid="input-register-password"
                                  className="pl-10 h-11 border-slate-300 dark:border-slate-600 focus-visible:ring-blue-600"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold" 
                        disabled={registerMutation.isPending}
                        data-testid="button-register"
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Account...
                          </>
                        ) : (
                          <>
                            Create Account
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="text-center space-y-3 pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-wider">
                Cimpleit Inc
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Powered by{" "}
              <a 
                href="https://cimpleit.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Cimpleit Inc
              </a>
            </p>
            <p className="text-xs text-muted-foreground">&copy; 2024 Cimpleit Inc. All rights reserved.</p>
            <p className="text-xs text-muted-foreground">Innovative AI and Data Analytics Solutions</p>
          </div>
        </div>
      </div>

      {/* Right side - Hero Section */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 lg:p-12 items-center justify-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-grid-white/5"></div>
        <div className="absolute top-20 right-20 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl"></div>

        <div className="max-w-xl text-white relative z-10 space-y-10">
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Next-Gen Contract Management</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
              Transform Your Contract Management
            </h2>
            <p className="text-lg text-blue-100 leading-relaxed">
              Harness the power of AI to automate contract analysis, assess risks, and gain intelligent insights that drive better business decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-right-8 duration-700 delay-300">
            <div className="flex items-start space-x-4 bg-white/5 backdrop-blur-sm p-5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">AI-Powered Analysis</h3>
                <p className="text-sm text-blue-100">
                  Automatically extract key terms, clauses, and obligations from any contract
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-white/5 backdrop-blur-sm p-5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Risk Assessment</h3>
                <p className="text-sm text-blue-100">
                  Identify potential issues and compliance risks before they become problems
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-white/5 backdrop-blur-sm p-5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Advanced Analytics</h3>
                <p className="text-sm text-blue-100">
                  Real-time insights and comprehensive reporting for data-driven decisions
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-8 pt-6 animate-in fade-in slide-in-from-right-8 duration-700 delay-500">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-sm font-medium">Enterprise Security</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-sm font-medium">99.9% Uptime</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-sm font-medium">24/7 Support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}