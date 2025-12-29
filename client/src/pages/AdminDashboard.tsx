import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LogOut, Check, X, Clock, Edit2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AdminAnalysisModal } from "./AdminAnalysisModal";
import type { SoilAnalysis } from "@shared/schema";

const AdminDashboard = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<SoilAnalysis | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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
    enabled: isAuthenticated,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/soil-analysis/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/soil-analysis/all"] });
      toast({ title: "Status atualizado com sucesso" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro ao atualizar status" });
    },
  });

  const submitAnalysisMutation = useMutation({
    mutationFn: (data: { id: number; status: string; adminComments: string; adminFileUrls: string }) =>
      apiRequest("PATCH", `/api/soil-analysis/${data.id}/review`, {
        status: data.status,
        adminComments: data.adminComments,
        adminFileUrls: data.adminFileUrls,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/soil-analysis/all"] });
      toast({ title: "Análise salva com sucesso" });
      setModalOpen(false);
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao salvar análise" });
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
            <h1 className="text-3xl font-bold dark:text-white">Análises de Solo</h1>
            <p className="text-slate-600 dark:text-slate-400">Gerenciador de submissões</p>
          </div>
          <Button variant="ghost" onClick={handleLogout} data-testid="button-admin-logout">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

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
      </div>
    </div>
  );
};

export default AdminDashboard;
