import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Login } from "@shared/schema";
import { Copy, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function generatePassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function generateUsername(): string {
  const adjectives = ["Blue", "Red", "Green", "Swift", "Happy", "Bold", "Smart", "Quick"];
  const animals = ["Lion", "Tiger", "Eagle", "Fox", "Wolf", "Bear", "Hawk", "Panda"];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj}${animal}${num}`;
}

export default function LoginGenerator() {
  const [clientName, setClientName] = useState("");
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const { data: logins = [] } = useQuery({
    queryKey: ["/api/logins"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const username = generateUsername();
      const password = generatePassword();
      const res = await apiRequest("POST", "/api/logins", {
        username,
        password,
        clientName: clientName || "Sem nome",
        email: email || undefined,
        status: "active",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logins"] });
      setClientName("");
      setEmail("");
      toast({ title: "Login gerado com sucesso!" });
    },
    onError: (error) => {
      toast({ title: "Erro", description: String(error), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/logins/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logins"] });
      toast({ title: "Login removido com sucesso!" });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!" });
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Gerador de Logins</h1>

        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Criar Novo Login</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nome do Cliente</label>
              <Input
                placeholder="Ex: João Silva"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                data-testid="input-client-name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email (opcional)</label>
              <Input
                type="email"
                placeholder="Ex: joao@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-email"
              />
            </div>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              data-testid="button-generate-login"
            >
              <Plus className="w-4 h-4 mr-2" />
              Gerar Login
            </Button>
          </div>
        </Card>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Logins Gerados ({logins.length})</h2>
          <div className="grid gap-4">
            {logins.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhum login gerado ainda</p>
            ) : (
              logins.map((login: Login) => (
                <Card key={login.id} className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{login.clientName}</h3>
                        <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                          {login.status}
                        </span>
                      </div>
                      {login.email && (
                        <p className="text-sm text-muted-foreground mb-3">{login.email}</p>
                      )}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Usuário:</span>
                          <code className="bg-muted px-2 py-1 rounded font-mono text-sm">
                            {login.username}
                          </code>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => copyToClipboard(login.username)}
                            data-testid={`button-copy-username-${login.id}`}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Senha:</span>
                          <code className="bg-muted px-2 py-1 rounded font-mono text-sm">
                            {login.password}
                          </code>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => copyToClipboard(login.password)}
                            data-testid={`button-copy-password-${login.id}`}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Criado em: {new Date(login.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => deleteMutation.mutate(login.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-login-${login.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
