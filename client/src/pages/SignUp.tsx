import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const signupSchema = z.object({
  fullName: z.string().min(3, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  confirmPassword: z.string(),
  phone: z.string().min(10, "Telefone é obrigatório"),
  address: z.string().min(5, "Endereço é obrigatório"),
  occupation: z.string().min(3, "Profissão é obrigatória"),
  education: z.string().min(3, "Formação é obrigatória"),
  birthDate: z.string().min(10, "Data de nascimento é obrigatória"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não correspondem",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignUp() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState<string>("");
  const [inviteValid, setInviteValid] = useState(false);
  const [checkingInvite, setCheckingInvite] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: inviteEmail,
    },
  });

  // Check invite code from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      setInviteCode(code);
      validateInvite(code);
    } else {
      setCheckingInvite(false);
    }
  }, []);

  const validateInvite = async (code: string) => {
    try {
      const response = await fetch(`/api/validate-invite?code=${code}`);
      const data = await response.json();

      if (data.valid) {
        setInviteEmail(data.email);
        setInviteValid(true);
        reset({ email: data.email });
      } else {
        toast({
          title: "Link expirado",
          description: "Este link de convite é inválido ou já foi usado.",
          variant: "destructive",
        });
        setInviteValid(false);
      }
    } catch (error) {
      console.error("Erro ao validar convite:", error);
      toast({
        title: "Erro",
        description: "Erro ao validar o link de convite.",
        variant: "destructive",
      });
      setInviteValid(false);
    } finally {
      setCheckingInvite(false);
    }
  };

  const onSubmit = async (data: SignupFormData) => {
    if (!inviteValid) {
      toast({
        title: "Convite inválido",
        description: "Você precisa de um link de convite válido para se cadastrar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;

      if (!authData.user) throw new Error("Falha ao criar usuário");

      // Save user profile in database
      const response = await fetch("/api/save-user-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          fullName: data.fullName,
          phone: data.phone,
          address: data.address,
          occupation: data.occupation,
          education: data.education,
          birthDate: data.birthDate,
          inviteCode,
        }),
      });

      if (!response.ok) throw new Error("Erro ao salvar perfil");

      toast({
        title: "Conta criada com sucesso!",
        description: "Você já pode acessar o sistema.",
      });

      setTimeout(() => {
        setLocation("/dashboard");
      }, 1500);
    } catch (error: any) {
      console.error("Erro ao cadastrar:", error);
      toast({
        title: "Erro ao cadastrar",
        description: error.message || "Ocorreu um erro ao criar sua conta.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            <p className="mt-4 text-gray-600">Validando convite...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!inviteValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Link Inválido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Este link de convite é inválido, expirado ou já foi usado. Solicite um novo link ao administrador.
            </p>
            <Button variant="outline" className="w-full" onClick={() => setLocation("/")}>
              Voltar para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Criar Conta</CardTitle>
          <CardDescription>Preencha suas informações para completar o cadastro</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  placeholder="João Silva"
                  {...register("fullName")}
                  data-testid="input-full-name"
                  disabled={loading}
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  data-testid="input-email"
                  disabled={loading}
                  readOnly
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  placeholder="(11) 99999-9999"
                  {...register("phone")}
                  data-testid="input-phone"
                  disabled={loading}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de Nascimento</Label>
                <Input
                  id="birthDate"
                  type="date"
                  {...register("birthDate")}
                  data-testid="input-birth-date"
                  disabled={loading}
                />
                {errors.birthDate && (
                  <p className="text-sm text-destructive">{errors.birthDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  placeholder="Rua, número, complemento"
                  {...register("address")}
                  data-testid="input-address"
                  disabled={loading}
                />
                {errors.address && (
                  <p className="text-sm text-destructive">{errors.address.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">Profissão</Label>
                <Input
                  id="occupation"
                  placeholder="Agricultor"
                  {...register("occupation")}
                  data-testid="input-occupation"
                  disabled={loading}
                />
                {errors.occupation && (
                  <p className="text-sm text-destructive">{errors.occupation.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="education">Formação Acadêmica</Label>
                <Input
                  id="education"
                  placeholder="Ensino Superior"
                  {...register("education")}
                  data-testid="input-education"
                  disabled={loading}
                />
                {errors.education && (
                  <p className="text-sm text-destructive">{errors.education.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  {...register("password")}
                  data-testid="input-password"
                  disabled={loading}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirme sua senha"
                  {...register("confirmPassword")}
                  data-testid="input-confirm-password"
                  disabled={loading}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={loading}
              data-testid="button-signup"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar Conta"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
