import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabaseClient";
import { Leaf, Sprout, Tractor, ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

// Schema validation for Auth
const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type AuthFormValues = z.infer<typeof authSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Login Form
  const loginForm = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" },
  });

  // Signup Form
  const signupForm = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" },
  });

  const onLogin = async (data: AuthFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Welcome back!",
        description: "Successfully logged in to WR Agro Tech.",
      });
      
      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "Could not sign in. Please check your credentials.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSignup = async (data: AuthFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Account created!",
        description: "Please check your email to confirm your account.",
      });
      
      // Optionally reset form or switch tab
      signupForm.reset();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: error.message || "Could not create account.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#f0f9f4] leaf-pattern relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      {/* Left Panel - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-16 relative z-10">
        <div className="max-w-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white p-3 rounded-2xl shadow-lg shadow-primary/10">
              <Sprout className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-secondary">WR Agro Tech</h1>
          </div>
          
          <h2 className="text-5xl font-extrabold text-secondary mb-6 leading-tight font-display">
            Cultivating the <span className="text-primary">Future</span> of Agriculture
          </h2>
          
          <p className="text-lg text-secondary/70 mb-10 leading-relaxed max-w-md">
            Advanced analytics, crop monitoring, and resource management solutions for modern farming. Join thousands of farmers optimizing their yields.
          </p>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/60 backdrop-blur-sm p-5 rounded-2xl border border-white/40 shadow-sm">
              <Leaf className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold text-secondary mb-1">Sustainable Growth</h3>
              <p className="text-sm text-muted-foreground">Eco-friendly solutions for better yields.</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm p-5 rounded-2xl border border-white/40 shadow-sm">
              <Tractor className="h-6 w-6 text-accent mb-3" />
              <h3 className="font-semibold text-secondary mb-1">Smart Automation</h3>
              <p className="text-sm text-muted-foreground">Efficiency through technology.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-12 relative z-10">
        <Card className="w-full max-w-md shadow-2xl shadow-primary/5 border-none bg-white/95 backdrop-blur-xl">
          <CardHeader className="space-y-1 text-center pb-2">
            <div className="lg:hidden flex justify-center mb-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Sprout className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-secondary">Welcome Back</CardTitle>
            <CardDescription>Enter your credentials to access your farm dashboard</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 p-1">
                <TabsTrigger value="login" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Login</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4 fade-in">
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-login">Email</Label>
                    <Input 
                      id="email-login" 
                      placeholder="farmer@wragrotech.com" 
                      type="email"
                      disabled={isLoading}
                      data-testid="login-email"
                      {...loginForm.register("email")}
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password-login">Password</Label>
                      <a href="#" className="text-xs text-primary hover:underline font-medium">Forgot password?</a>
                    </div>
                    <Input 
                      id="password-login" 
                      type="password"
                      placeholder="••••••••"
                      disabled={isLoading}
                      data-testid="login-password"
                      {...loginForm.register("password")}
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  
                  <Button type="submit" className="w-full" size="lg" disabled={isLoading} data-testid="login-submit">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      <>
                        Log In <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4 fade-in">
                <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-signup">Email</Label>
                    <Input 
                      id="email-signup" 
                      placeholder="farmer@wragrotech.com" 
                      type="email"
                      disabled={isLoading}
                      data-testid="signup-email"
                      {...signupForm.register("email")}
                    />
                    {signupForm.formState.errors.email && (
                      <p className="text-xs text-destructive">{signupForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signup">Password</Label>
                    <Input 
                      id="password-signup" 
                      type="password"
                      placeholder="Create a strong password"
                      disabled={isLoading}
                      data-testid="signup-password"
                      {...signupForm.register("password")}
                    />
                    {signupForm.formState.errors.password && (
                      <p className="text-xs text-destructive">{signupForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  
                  <Button type="submit" variant="secondary" className="w-full" size="lg" disabled={isLoading} data-testid="signup-submit">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border/50 pt-6">
            <p className="text-xs text-muted-foreground text-center">
              By continuing, you agree to our <a href="#" className="underline hover:text-primary">Terms of Service</a> and <a href="#" className="underline hover:text-primary">Privacy Policy</a>.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
