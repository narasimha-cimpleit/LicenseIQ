import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Loader2, Lock, Mail, User, ArrowRight, Sparkles, CheckCircle, TrendingUp, Clock, FileCheck, Shield, Zap, Globe } from "lucide-react";
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
                <img src={cimpleitLogo} alt="CimpleIT Inc Logo" className="w-12 h-12 relative z-10 drop-shadow-lg" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                LicenseIQ
              </h1>
            </div>
            <div className="flex items-center justify-center space-x-2 text-sm">
              <span className="text-muted-foreground font-medium">by</span>
              <span className="font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">CimpleIT</span>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-powered licensing management platform
            </p>
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
                  <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
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
          <div className="text-center space-y-2 pt-6 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-muted-foreground">
              Powered by{" "}
              <a 
                href="https://cimpleit.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                CimpleIT
              </a>
            </p>
            <p className="text-xs text-muted-foreground">&copy; 2025 CimpleIT Inc. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Right side - Business Benefits Section */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 lg:p-12 items-center justify-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-grid-white/5"></div>
        <div className="absolute top-20 right-20 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl"></div>

        <div className="max-w-xl text-white relative z-10 space-y-8">
          {/* Main Headline */}
          <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">AI-Powered Platform</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
              Reads contracts like a lawyer, calculates like an accountant
            </h2>
            <p className="text-lg text-blue-100 leading-relaxed">
              LicenseIQ transforms how manufacturing companies manage their licensing agreements and payment calculations. Our AI agent eliminates manual errors, ensures audit compliance, and automates complex royalty and licensing fee calculations with lawyer-level contract reading and accountant-level precision.
            </p>
          </div>

          {/* Key Benefits */}
          <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
            <h3 className="text-2xl font-bold">Key Benefits</h3>
            
            <div className="grid gap-4">
              {/* AI Contract Intelligence */}
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                <div className="flex items-start space-x-3">
                  <Sparkles className="h-5 w-5 text-blue-200 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-base">AI Contract Intelligence</h4>
                    <p className="text-sm text-blue-100 mt-1">
                      Automatically extracts licensing terms and understands complex royalty structures
                    </p>
                  </div>
                </div>
              </div>

              {/* Eliminate Payment Errors */}
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-blue-200 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-base">Eliminate Payment Errors</h4>
                    <p className="text-sm text-blue-100 mt-1">
                      Prevent $10K-$100K+ disputes with automated accuracy and audit-ready calculations
                    </p>
                  </div>
                </div>
              </div>

              {/* 95% Time Savings */}
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-blue-200 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-base">95% Time Savings</h4>
                    <p className="text-sm text-blue-100 mt-1">
                      Turn 10-40 hours of work into just 30 minutes per agreement per quarter
                    </p>
                  </div>
                </div>
              </div>

              {/* Professional Reporting */}
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                <div className="flex items-start space-x-3">
                  <FileCheck className="h-5 w-5 text-blue-200 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-base">Professional Reporting</h4>
                    <p className="text-sm text-blue-100 mt-1">
                      Generate branded audit-ready reports and compliance documentation instantly
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Implementation & ROI */}
          <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20 animate-in fade-in slide-in-from-right-8 duration-700 delay-300">
            <h4 className="font-semibold text-lg mb-3 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Quick Implementation & ROI
            </h4>
            <ul className="space-y-2 text-sm text-blue-100">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-green-400" />
                <span>4-week implementation vs 18-month solutions</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-green-400" />
                <span>Save $50K-$200K annually in labor costs</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-green-400" />
                <span>Immediate ROI with CSV imports</span>
              </li>
            </ul>
          </div>

          {/* Enterprise-Ready Features */}
          <div className="flex items-center justify-between pt-4 animate-in fade-in slide-in-from-right-8 duration-700 delay-400">
            <div className="flex items-center space-x-2 text-sm">
              <Zap className="h-4 w-4" />
              <span>ERP Integration</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Globe className="h-4 w-4" />
              <span>Multi-Currency</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Shield className="h-4 w-4" />
              <span>Audit Compliance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
