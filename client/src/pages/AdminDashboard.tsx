import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, Check, X, Clock, Edit2, Copy, Trash2, Plus } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AdminAnalysisModal } from "./AdminAnalysisModal";
import type { SoilAnalysis } from "@shared/schema";
import { supabase } from "@/lib/supabaseClient";

function generatePassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function calculateExpirationDate(planType: string): string {
  const now = new Date();
  const daysMap: { [key: string]: number } = {
    "1_month": 30,
    "3_months": 90,
    "6_months": 180
  };
  const days = daysMap[planType] || 30;
  const expireDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return expireDate.toISOString();
}

function formatExpirationDate(expiresAt: string | null): string {
  if (!expiresAt) return "Data inválida";
  try {
    const date = new Date(expiresAt);
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      return "Data inválida";
    }
    return date.toLocaleDateString("pt-BR");
  } catch (e) {
    return "Data inválida";
  }
}

const AdminDashboard = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<SoilAnalysis | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("analyses");
  const [clientName, setClientName] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("1_month");

  // Check admin password on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem("adminAuth");
    if (savedAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleAdminLogin = () => {
    // Simple password check (change this password!)
    if (adminPassword === "admin123") {
      setIsAuthenticated(true);
      localStorage.setItem("adminAuth", "true");
      toast({ title: "Acesso liberado", description: "Bem-vindo ao painel admin" });
    } else {
      toast({ variant: "destructive", title: "Erro", description: "Senha incorreta" });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    setIsAuthenticated(false);
    setLocation("/dashboard");
  };

  const { data: analyses = [], isLoading } = useQuery<SoilAnalysis[]>({
    queryKey: ["/api/soil-analysis/all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('soil_analysis')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      // Map database snake_case to camelCase for frontend
      return (data || []).map((a: any) => ({
        ...a,
        fieldName: a.field_name,
        cropType: a.crop_type,
        userEmail: a.user_email,
        organicMatter: a.organic_matter,
        adminComments: a.admin_comments,
        adminFileUrls: a.admin_file_urls,
        updatedAt: a.updated_at,
        createdAt: a.created_at
      }));
    },
    enabled: isAuthenticated,
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery<any[]>({
    queryKey: ["/api/users/all"],
    queryFn: async () => {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      return (data || []).map((u: any) => ({
        ...u,
        hasAccessed: u.has_accessed,
        createdAt: u.created_at
      }));
    },
    enabled: isAuthenticated,
  });

  const { data: logins = [], isLoading: isLoadingLogins } = useQuery<any[]>({
    queryKey: ["/api/logins"],
    queryFn: async () => {
      const { data, error } = await supabase.from('logins').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((l: any) => ({
        ...l,
        clientName: l.client_name,
        createdAt: l.created_at
      }));
    },
    enabled: isAuthenticated,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const { error } = await supabase.from('soil_analysis').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/soil-analysis/all"] });
      toast({ title: "Status atualizado com sucesso" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro ao atualizar status" });
    },
  });

  const submitAnalysisMutation = useMutation({
    mutationFn: async (data: { id: number; status: string; adminComments: string; adminFileUrls: string }) => {
      const { error } = await supabase.from('soil_analysis').update({
        status: data.status,
        adminComments: data.adminComments,
        adminFileUrls: data.adminFileUrls,
        updatedAt: new Date().toISOString()
      }).eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/soil-analysis/all"] });
      toast({ title: "Análise salva com sucesso" });
      setModalOpen(false);
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao salvar análise" });
    },
  });

  const createLoginMutation = useMutation({
    mutationFn: async () => {
      if (!email) {
        throw new Error("Email é obrigatório");
      }
      const password = generatePassword();
      const expiresAt = calculateExpirationDate(plan);
      const { error } = await supabase.from('logins').insert({
        username: email,
        password,
        client_name: clientName,
        email: email,
        plan: plan,
        expires_at: expiresAt,
        status: "active"
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logins"] });
      setClientName("");
      setEmail("");
      setPlan("1_month");
      toast({ title: "Login gerado com sucesso!" });
    },
    onError: (error) => {
      toast({ title: "Erro", description: String(error), variant: "destructive" });
    },
  });

  const deleteLoginMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('logins').delete().eq('id', id);
      if (error) throw error;
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

  const filteredAnalyses = filterStatus
    ? analyses.filter((a) => a.status === filterStatus)
    : analyses;

  const statusConfig = {
    pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
    approved: { label: "Aprovado", color: "bg-green-100 text-green-800", icon: Check },
    rejected: { label: "Rejeitado", color: "bg-red-100 text-red-800", icon: X },
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Painel Administrativo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Senha do Admin</label>
              <Input
                type="password"
                placeholder="Digite a senha"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                data-testid="input-admin-password"
              />
            </div>
            <Button onClick={handleAdminLogin} className="w-full" data-testid="button-admin-login">
              Entrar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold dark:text-white">Painel Administrativo</h1>
            <p className="text-slate-600 dark:text-slate-400">Gerenciar análises e logins</p>
          </div>
          <Button variant="ghost" onClick={handleLogout} data-testid="button-admin-logout">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList>
            <TabsTrigger value="analyses">Análises de Solo</TabsTrigger>
            <TabsTrigger value="logins">Gerador de Logins</TabsTrigger>
          </TabsList>

          <TabsContent value="analyses" className="space-y-6">

            {/* Filters */}
            <div className="flex gap-2 mb-6">
              <Button
                variant={filterStatus === null ? "default" : "outline"}
                onClick={() => setFilterStatus(null)}
                data-testid="filter-all"
              >
                Todos ({analyses.length})
              </Button>
              {Object.entries(statusConfig).map(([status, config]) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "default" : "outline"}
                  onClick={() => setFilterStatus(status)}
                  data-testid={`filter-${status}`}
                >
                  {config.label} ({analyses.filter((a) => a.status === status).length})
                </Button>
              ))}
            </div>

            {/* Logins/Clients List */}
            <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold dark:text-white">Clientes Cadastrados ({logins.length})</h2>
          </div>
          {isLoadingLogins ? (
            <Card><CardContent className="p-4">Carregando clientes...</CardContent></Card>
          ) : logins.length === 0 ? (
            <Card><CardContent className="p-4">Nenhum cliente cadastrado</CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="border-b bg-slate-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Nome Cliente</th>
                      <th className="px-4 py-3 text-left font-semibold">Email</th>
                      <th className="px-4 py-3 text-left font-semibold">Plano</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Expira em</th>
                      <th className="px-4 py-3 text-left font-semibold">Dias Restantes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logins.map((login: any) => {
                      const expiresAt = login.expires_at ? new Date(login.expires_at) : null;
                      const today = new Date();
                      const daysRemaining = expiresAt ? Math.ceil((expiresAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : -1;
                      const isExpired = daysRemaining < 0;
                      
                      return (
                        <tr key={login.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                          <td className="px-4 py-3 font-medium">{login.clientName || "Sem nome"}</td>
                          <td className="px-4 py-3">{login.email}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">
                              {login.plan === "1_month" ? "1 mês" : login.plan === "3_months" ? "3 meses" : "6 meses"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={login.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                              {login.status === "active" ? "Ativo" : "Inativo"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                            {expiresAt ? expiresAt.toLocaleDateString("pt-BR") : "-"}
                          </td>
                          <td className="px-4 py-3">
                            {isExpired ? (
                              <Badge className="bg-red-100 text-red-800">Expirado</Badge>
                            ) : (
                              <Badge className={daysRemaining <= 7 ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}>
                                {daysRemaining} dias
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>

            {/* Table */}
            {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center text-slate-500">Carregando...</CardContent>
          </Card>
        ) : filteredAnalyses.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-slate-500">
              Nenhuma análise encontrada
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="border-b bg-slate-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Email</th>
                      <th className="px-4 py-3 text-left font-semibold">Campo</th>
                      <th className="px-4 py-3 text-left font-semibold">Cultura</th>
                      <th className="px-4 py-3 text-left font-semibold">pH</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAnalyses.map((analysis) => (
                      <tr key={analysis.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{analysis.userEmail}</td>
                        <td className="px-4 py-3 font-medium" data-testid={`text-field-${analysis.id}`}>
                          {analysis.fieldName}
                        </td>
                        <td className="px-4 py-3">{analysis.cropType}</td>
                        <td className="px-4 py-3 font-mono">{analysis.pH}</td>
                        <td className="px-4 py-3">
                          <Badge className={statusConfig[analysis.status as keyof typeof statusConfig]?.color}>
                            {statusConfig[analysis.status as keyof typeof statusConfig]?.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              onClick={() => {
                                setSelectedAnalysis(analysis);
                                setModalOpen(true);
                              }}
                              data-testid={`button-edit-${analysis.id}`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: analysis.id,
                                  status: "approved",
                                })
                              }
                              disabled={updateStatusMutation.isPending}
                              data-testid={`button-approve-${analysis.id}`}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: analysis.id,
                                  status: "rejected",
                                })
                              }
                              disabled={updateStatusMutation.isPending}
                              data-testid={`button-reject-${analysis.id}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
            </div>
            )}

            {/* Modal */}
            <AdminAnalysisModal
              open={modalOpen}
              analysis={selectedAnalysis}
              onClose={() => setModalOpen(false)}
              onSubmit={(data) =>
                submitAnalysisMutation.mutateAsync({
                  id: selectedAnalysis!.id,
                  ...data,
                })
              }
            />
          </TabsContent>

          <TabsContent value="logins" className="space-y-6">
            {/* Create Login Form */}
            <Card>
              <CardHeader>
                <CardTitle>Criar Novo Login</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <label className="block text-sm font-medium mb-2">Email (será o usuário)</label>
                  <Input
                    type="email"
                    placeholder="Ex: joao@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    data-testid="input-email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Plano</label>
                  <Select value={plan} onValueChange={setPlan}>
                    <SelectTrigger data-testid="select-plan">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1_month">1 Mês</SelectItem>
                      <SelectItem value="3_months">3 Meses</SelectItem>
                      <SelectItem value="6_months">6 Meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => createLoginMutation.mutate()}
                  disabled={createLoginMutation.isPending}
                  data-testid="button-generate-login"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Gerar Login
                </Button>
              </CardContent>
            </Card>

            {/* Logins List */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 dark:text-white">Logins Gerados ({logins.length})</h2>
              {isLoadingLogins ? (
                <Card><CardContent className="p-4">Carregando logins...</CardContent></Card>
              ) : logins.length === 0 ? (
                <Card><CardContent className="p-4 text-center text-slate-500">Nenhum login gerado ainda</CardContent></Card>
              ) : (
                <div className="grid gap-4">
                  {logins.map((login: any) => (
                    <Card key={login.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{login.clientName}</h3>
                              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                                {login.status}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{login.email}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                              Plano: {login.plan === "1_month" ? "1 Mês" : login.plan === "3_months" ? "3 Meses" : "6 Meses"} | 
                              Expira em: {formatExpirationDate(login.expires_at)}
                            </p>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">Usuário:</span>
                                <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono text-sm">
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
                                <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono text-sm">
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
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                              Criado em: {new Date(login.createdAt).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => deleteLoginMutation.mutate(login.id)}
                            disabled={deleteLoginMutation.isPending}
                            data-testid={`button-delete-login-${login.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
