import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { LogOut, Check, X, Clock, Edit2, Copy, Trash2, Plus, RefreshCw } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AdminAnalysisModal } from "./AdminAnalysisModal";
import type { SoilAnalysis } from "@shared/schema";
import { supabase } from "@/lib/supabaseClient";

function generatePassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function calculateExpirationDate(planType: string): string {
  const now = new Date();
  const daysMap: { [key: string]: number } = {
    "1_month": 30,
    "3_months": 90,
    "6_months": 180,
    "lifetime": 36500
  };
  const days = daysMap[planType] || 30;
  const expireDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return expireDate.toISOString();
}

const AdminDashboard = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<SoilAnalysis | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);
  const [selectedLoginForRenewal, setSelectedLoginForRenewal] = useState<any>(null);
  const [renewalPlan, setRenewalPlan] = useState("1_month");
  const [editLoginModalOpen, setEditLoginModalOpen] = useState(false);
  const [selectedLoginForEdit, setSelectedLoginForEdit] = useState<any>(null);
  const [editPlan, setEditPlan] = useState("1_month");
  const [editExpiresAt, setEditExpiresAt] = useState("");
  const [activeTab, setActiveTab] = useState("analyses");
  const [clientName, setClientName] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("1_month");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteDuration, setInviteDuration] = useState("1_month");
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState("");

  useEffect(() => {
    const savedAuth = localStorage.getItem("adminAuth");
    if (savedAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleAdminLogin = () => {
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

  const { data: analyses = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/soil-analysis/all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('soil_analysis')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((a: any) => ({
        ...a,
        fieldName: a.field_name,
        cropType: a.crop_type,
        userEmail: a.user_email,
        producerName: a.producer_name,
        producerContact: a.producer_contact,
        producerAddress: a.producer_address,
        propertyName: a.property_name,
        cropAge: a.crop_age,
        productionType: a.production_type,
        sampleDepth: a.sample_depth,
        collectedBy: a.collected_by,
        soilAnalysisPdf: a.soil_analysis_pdf,
        attachments: a.attachments,
        adminComments: a.admin_comments,
        adminFileUrls: a.admin_file_urls,
        updatedAt: a.updated_at,
        createdAt: a.created_at
      })) as any[];
    },
    enabled: isAuthenticated,
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery<any[]>({
    queryKey: ["/api/auth-users"],
    queryFn: async () => {
      const response = await fetch('/api/auth-users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    enabled: isAuthenticated,
  });

  const { data: logins = [], isLoading: isLoadingLogins } = useQuery<any[]>({
    queryKey: ["/api/logins"],
    queryFn: async () => {
      const response = await fetch('/api/logins');
      if (!response.ok) throw new Error('Failed to fetch logins');
      const data = await response.json();
      return (data || []).map((l: any) => ({
        ...l,
        clientName: l.client_name,
        createdAt: l.created_at
      }));
    },
    enabled: isAuthenticated,
  });

  const submitAnalysisMutation = useMutation({
    mutationFn: async (data: { id: number; status: string; adminComments: string; adminFileUrls: string }) => {
      const response = await fetch(`/api/soil-analysis/${data.id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: data.status,
          adminComments: data.adminComments,
          adminFileUrls: data.adminFileUrls
        })
      });
      
      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao atualizar análise');
        } else {
          const text = await response.text();
          throw new Error(text || 'Erro interno do servidor');
        }
      }
      
      if (contentType && contentType.includes("application/json")) {
        return response.json();
      }
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/soil-analysis/all"] });
      toast({ title: "Análise atualizada com sucesso" });
      setModalOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        variant: "destructive", 
        title: "Erro", 
        description: error.message || "Erro ao atualizar análise" 
      });
    }
  });

  const createInviteMutation = useMutation({
    mutationFn: async () => {
      if (!inviteEmail) throw new Error("Email é obrigatório");
      const response = await fetch('/api/create-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim().toLowerCase(),
          expiresIn: inviteDuration === '1_month' ? 30 : inviteDuration === '3_months' ? 90 : inviteDuration === '6_months' ? 180 : 36500
        })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar link');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedInviteUrl(data.inviteUrl);
      toast({ title: "Link gerado com sucesso!" });
      setInviteEmail("");
    },
  });

  const deleteLoginMutation = useMutation({
    mutationFn: async ({ loginId }: { loginId: number }) => {
      const { error } = await supabase.from('logins').delete().eq('id', loginId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logins"] });
      toast({ title: "Login removido com sucesso!" });
    },
  });

  const updateLoginMutation = useMutation({
    mutationFn: async ({ loginId, plan, expiresAt }: { loginId: number; plan: string; expiresAt: string }) => {
      const response = await fetch(`/api/logins/${loginId}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, expiresAt })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar login');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logins"] });
      toast({ title: "Login atualizado com sucesso!" });
      setEditLoginModalOpen(false);
    },
  });

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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader><CardTitle>Painel Administrativo</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Senha do Admin"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
            />
            <Button onClick={handleAdminLogin} className="w-full">Entrar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Painel Administrativo</h1>
          <Button variant="ghost" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" />Sair</Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList>
            <TabsTrigger value="analyses">Análises</TabsTrigger>
            <TabsTrigger value="clients">Clientes</TabsTrigger>
            <TabsTrigger value="invites">Convites</TabsTrigger>
            <TabsTrigger value="logins">Logins</TabsTrigger>
          </TabsList>

          <TabsContent value="analyses" className="space-y-6">
            <div className="flex gap-2">
              <Button variant={filterStatus === null ? "default" : "outline"} onClick={() => setFilterStatus(null)}>
                Todos ({analyses.length})
              </Button>
              {Object.entries(statusConfig).map(([status, config]) => (
                <Button key={status} variant={filterStatus === status ? "default" : "outline"} onClick={() => setFilterStatus(status)}>
                  {config.label} ({analyses.filter(a => a.status === status).length})
                </Button>
              ))}
            </div>

            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-slate-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Produtor</th>
                      <th className="px-4 py-3 text-left">Propriedade</th>
                      <th className="px-4 py-3 text-left">Cultura</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAnalyses.map((a) => (
                      <tr key={a.id} className="border-b hover:bg-slate-100 dark:hover:bg-slate-800">
                        <td className="px-4 py-3">{a.userEmail}</td>
                        <td className="px-4 py-3">{a.producerName || "-"}</td>
                        <td className="px-4 py-3">{a.propertyName || "-"}</td>
                        <td className="px-4 py-3">{a.cropType}</td>
                        <td className="px-4 py-3">
                          <Badge className={statusConfig[a.status as keyof typeof statusConfig]?.color}>{statusConfig[a.status as keyof typeof statusConfig]?.label}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Button size="sm" variant="outline" onClick={() => { setSelectedAnalysis(a); setModalOpen(true); }}>
                            Revisar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients" className="space-y-6">
            <h2 className="text-xl font-bold">Clientes Cadastrados ({users.length})</h2>
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-slate-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-4 py-3 text-left">Nome</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Telefone</th>
                      <th className="px-4 py-3 text-left">Profissão</th>
                      <th className="px-4 py-3 text-left">Cadastro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b hover:bg-slate-100 dark:hover:bg-slate-800">
                        <td className="px-4 py-3">{u.email?.split('@')[0] || "-"}</td>
                        <td className="px-4 py-3">{u.email}</td>
                        <td className="px-4 py-3">-</td>
                        <td className="px-4 py-3">-</td>
                        <td className="px-4 py-3">{u.createdAt ? new Date(u.createdAt).toLocaleDateString("pt-BR") : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invites" className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Gerar Novo Convite</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Email do Cliente" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                <Button onClick={() => createInviteMutation.mutate()} className="w-full">Gerar Link</Button>
                {generatedInviteUrl && (
                  <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md break-all flex items-center justify-between">
                    <span className="mr-2">{generatedInviteUrl}</span>
                    <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(generatedInviteUrl); toast({ title: "Copiado!" }); }}><Copy className="w-4 h-4" /></Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logins" className="space-y-6">
            <h2 className="text-xl font-bold">Logins Gerados ({logins.length})</h2>
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-slate-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-4 py-3 text-left">Cliente</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Plano</th>
                      <th className="px-4 py-3 text-left">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logins.map((l) => (
                      <tr key={l.id} className="border-b hover:bg-slate-100 dark:hover:bg-slate-800">
                        <td className="px-4 py-3">{l.clientName}</td>
                        <td className="px-4 py-3">{l.email}</td>
                        <td className="px-4 py-3"><Badge variant="outline">{l.plan}</Badge></td>
                        <td className="px-4 py-3 flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setSelectedLoginForEdit(l); setEditPlan(l.plan); setEditExpiresAt(l.expires_at?.split('T')[0] || ''); setEditLoginModalOpen(true); }}><Edit2 className="w-4 h-4" /></Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteLoginMutation.mutate({ loginId: l.id })}><Trash2 className="w-4 h-4" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {selectedAnalysis && (
        <AdminAnalysisModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          analysis={selectedAnalysis}
          onSubmit={(data) => submitAnalysisMutation.mutate({ id: selectedAnalysis.id, ...data })}
          onDelete={async (id) => {
            const response = await fetch(`/api/soil-analysis/${id}`, { method: 'DELETE' });
            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Erro ao deletar');
            }
            queryClient.invalidateQueries({ queryKey: ["/api/soil-analysis/all"] });
            toast({ title: "Análise deletada com sucesso" });
            setModalOpen(false);
          }}
        />
      )}

      <Dialog open={editLoginModalOpen} onOpenChange={setEditLoginModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Login</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Plano</label>
              <Select value={editPlan} onValueChange={setEditPlan}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1_month">1 Mês</SelectItem>
                  <SelectItem value="3_months">3 Meses</SelectItem>
                  <SelectItem value="6_months">6 Meses</SelectItem>
                  <SelectItem value="lifetime">Lifetime</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Data de Expiração</label>
              <Input type="date" value={editExpiresAt} onChange={(e) => setEditExpiresAt(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditLoginModalOpen(false)}>Cancelar</Button>
            <Button onClick={() => {
              if (selectedLoginForEdit) {
                updateLoginMutation.mutate({ loginId: selectedLoginForEdit.id, plan: editPlan, expiresAt: new Date(editExpiresAt).toISOString() });
              }
            }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
