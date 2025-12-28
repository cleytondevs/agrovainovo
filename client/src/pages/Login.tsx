import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabaseClient";
import { Sprout, Loader2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const authSchema = z.object({
  email: z.string().email("Por favor, insira um endereço de e-mail válido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

type AuthFormValues = z.infer<typeof authSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLinkExpired, setIsLinkExpired] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [linkCode, setLinkCode] = useState<string | null>(null);

  // Generate unique link code
  const generateLinkCode = () => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  };

  useEffect(() => {
    const checkAccessLink = async () => {
      try {
        // Get link code from URL or sessionStorage
        const urlParams = new URLSearchParams(window.location.search);
        const codeFromUrl = urlParams.get("code");
        const codeFromSession = sessionStorage.getItem("accessLinkCode");
        const code = codeFromUrl || codeFromSession;

        if (code) {
          setLinkCode(code);
          
          // Check if link exists and has uses remaining
          const { data, error } = await supabase
            .from("access_links")
            .select("uses_remaining")
            .eq("link_code", code)
            .maybeSingle();
          
          if (data && data.uses_remaining <= 0) {
            setIsLinkExpired(true);
          } else if (!data) {
            // Link doesn't exist or was already used
            setIsLinkExpired(true);
          }
        }
      } catch (err) {
        console.error("Erro ao verificar link:", err);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkAccessLink();
  }, []);

  const authForm = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" },
  });

  const onAuth = async (data: AuthFormValues) => {
    setIsLoading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (signUpError) throw signUpError;

      // Generate new access link with single use
      const newLinkCode = generateLinkCode();
      const { error: insertError } = await supabase
        .from("access_links")
        .insert([{ 
          link_code: newLinkCode, 
          uses_remaining: 1,
          email: data.email 
        }]);

      if (insertError) throw insertError;

      const accessUrl = `${window.location.origin}?code=${newLinkCode}`;

      toast({
        title: "Acesso criado!",
        description: `Link: ${accessUrl}`,
      });
      
      // Store link code in session and mark as used
      sessionStorage.setItem("accessLinkCode", newLinkCode);
      setLinkCode(newLinkCode);
      
      // Decrement uses immediately after creation
      const { error: updateError } = await supabase
        .from("access_links")
        .update({ uses_remaining: 0 })
        .eq("link_code", newLinkCode);
      
      if (!updateError) {
        setIsLinkExpired(true);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar acesso",
        description: error.message || "Não foi possível configurar seu acesso.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f9f4]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isLinkExpired) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f0f9f4] p-4">
        <Card className="w-full max-w-md border-none shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold text-secondary">Link Expirado</CardTitle>
            <CardDescription>
              Este link de configuração de acesso foi utilizado e não pode ser reutilizado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTitle>Atenção</AlertTitle>
              <AlertDescription>
                Cada link pode ser usado apenas uma vez. Para obter um novo link, solicite ao administrador.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex bg-[#f0f9f4] relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full flex items-center justify-center p-4 relative z-10">
        <Card className="w-full max-w-md shadow-2xl border-none bg-white/95 backdrop-blur-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Sprout className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-secondary">Configurar Acesso</CardTitle>
            <CardDescription>Crie seu e-mail e senha (único acesso).</CardDescription>
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
                  {...authForm.register("email")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input 
                  id="password" 
                  type="password"
                  placeholder="••••••••"
                  disabled={isLoading}
                  {...authForm.register("password")}
                />
              </div>
              
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Criar Acesso"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
