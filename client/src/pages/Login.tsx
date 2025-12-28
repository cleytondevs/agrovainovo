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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const authSchema = z.object({
  email: z.string().email("Por favor, insira um endereço de e-mail válido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

type AuthFormValues = z.infer<typeof authSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const authForm = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" },
  });

  const onAuth = async (data: AuthFormValues) => {
    setIsLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
           const { error: signUpError } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
          });

          if (signUpError) throw signUpError;

          toast({
            title: "Acesso em criação!",
            description: "Verifique seu e-mail para confirmar seu acesso.",
          });
          return;
        }
        throw signInError;
      }

      toast({
        title: "Bem-vindo!",
        description: "Login realizado com sucesso na WR Agro Tech.",
      });
      
      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao acessar",
        description: error.message || "Não foi possível realizar o acesso. Verifique seus dados.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#f0f9f4] relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-16 relative z-10">
        <div className="max-w-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white p-3 rounded-2xl shadow-lg shadow-primary/10">
              <Sprout className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-secondary">WR Agro Tech</h1>
          </div>
          
          <h2 className="text-5xl font-extrabold text-secondary mb-6 leading-tight font-display">
            Cultivando o <span className="text-primary">Futuro</span> da Agricultura
          </h2>
          
          <p className="text-lg text-secondary/70 mb-10 leading-relaxed max-w-md">
            Soluções inteligentes para o agronegócio moderno. Crie seu acesso abaixo para começar.
          </p>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/60 backdrop-blur-sm p-5 rounded-2xl border border-white/40 shadow-sm">
              <Leaf className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold text-secondary mb-1">Sustentabilidade</h3>
              <p className="text-sm text-muted-foreground">Tecnologia a favor da natureza.</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm p-5 rounded-2xl border border-white/40 shadow-sm">
              <Tractor className="h-6 w-6 text-accent mb-3" />
              <h3 className="font-semibold text-secondary mb-1">Tecnologia</h3>
              <p className="text-sm text-muted-foreground">Eficiência e automação no campo.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-12 relative z-10">
        <Card className="w-full max-w-md shadow-2xl shadow-primary/5 border-none bg-white/95 backdrop-blur-xl">
          <CardHeader className="space-y-1 text-center pb-2">
            <div className="lg:hidden flex justify-center mb-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Sprout className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-secondary">Acesso ao Painel</CardTitle>
            <CardDescription>Crie seu login e senha abaixo</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={authForm.handleSubmit(onAuth)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input 
                  id="email" 
                  placeholder="seu@email.com" 
                  type="email"
                  disabled={isLoading}
                  data-testid="auth-email"
                  {...authForm.register("email")}
                />
                {authForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{authForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input 
                  id="password" 
                  type="password"
                  placeholder="••••••••"
                  disabled={isLoading}
                  data-testid="auth-password"
                  {...authForm.register("password")}
                />
                {authForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{authForm.formState.errors.password.message}</p>
                )}
              </div>
              
              <Button type="submit" className="w-full" size="lg" disabled={isLoading} data-testid="auth-submit">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    Criar Login e Senha <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border/50 pt-6">
            <p className="text-xs text-muted-foreground text-center">
              Ao continuar, você concorda com nossos <a href="#" className="underline hover:text-primary">Termos</a> e <a href="#" className="underline hover:text-primary">Privacidade</a>.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
