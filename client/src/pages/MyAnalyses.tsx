import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogOut, FileText, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SoilAnalysis } from "@shared/schema";

export default function MyAnalyses() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { getSupabaseClient } = await import("@/lib/supabaseClient");
        const client = await getSupabaseClient();
        const { data: { user } } = await client.auth.getUser();
        if (!user) setLocation("/");
        else setUser(user);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [setLocation]);

  const { data: analyses = [], isLoading } = useQuery<SoilAnalysis[]>({
    queryKey: ["/api/soil-analysis/user", user?.email],
    queryFn: async () => {
      const response = await fetch(`/api/soil-analysis/user/${encodeURIComponent(user?.email)}`);
      if (!response.ok) throw new Error("Failed to fetch analyses");
      return response.json();
    },
    enabled: !!user?.email,
    staleTime: 1000 * 60 * 5,
  });

  const handleLogout = async () => {
    const { getSupabaseClient } = await import("@/lib/supabaseClient");
    const client = await getSupabaseClient();
    await client.auth.signOut();
    setUser(null);
    setLocation("/");
    toast({ title: "Desconectado com sucesso" });
  };

  const handleDownloadFile = (fileUrl: string) => {
    try {
      // Create a link and trigger download
      const link = document.createElement("a");
      link.href = fileUrl;
      link.setAttribute("download", fileUrl.split("/").pop() || "analise.pdf");
      link.target = "_blank"; // Open in new tab if it can't be downloaded directly
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({ 
        title: "Download iniciado", 
        description: "O download do seu relatório começou." 
      });
    } catch (error) {
      console.error("Erro ao baixar arquivo:", error);
      toast({ 
        variant: "destructive",
        title: "Erro no download", 
        description: "Não foi possível baixar o arquivo no momento." 
      });
    }
  };

  const statusConfig = {
    pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
    approved: { label: "Aprovado", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
    rejected: { label: "Rejeitado", color: "bg-red-100 text-red-800", icon: XCircle },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f9f4]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f0f9f4]">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Minhas Análises</h1>
            <p className="text-sm text-slate-600">{user?.email}</p>
          </div>
          <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin">⏳</div>
            <span className="ml-2 text-slate-600">Carregando...</span>
          </div>
        ) : analyses.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">Nenhuma análise de solo ainda</p>
              <Button onClick={() => setLocation("/dashboard")} className="mt-4">
                Ir para Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {analyses.map((analysis) => {
              const config = statusConfig[analysis.status as keyof typeof statusConfig] || statusConfig.pending;
              const StatusIcon = config.icon;

              return (
                <Card key={analysis.id} className="hover-elevate">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{analysis.fieldName}</CardTitle>
                        <p className="text-sm text-slate-600 mt-1">
                          Cultura: <span className="font-medium">{analysis.cropType}</span>
                        </p>
                      </div>
                      <Badge className={config.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {config.label}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Dados da Análise */}
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                      <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-3">
                        Dados da Análise
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-slate-600 dark:text-slate-400">pH</span>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{analysis.pH}</p>
                        </div>
                        <div>
                          <span className="text-slate-600 dark:text-slate-400">Nitrogênio</span>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{analysis.nitrogen} ppm</p>
                        </div>
                        <div>
                          <span className="text-slate-600 dark:text-slate-400">Fósforo</span>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{analysis.phosphorus} ppm</p>
                        </div>
                        <div>
                          <span className="text-slate-600 dark:text-slate-400">Potássio</span>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{analysis.potassium} ppm</p>
                        </div>
                        <div>
                          <span className="text-slate-600 dark:text-slate-400">Umidade</span>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{analysis.moisture}%</p>
                        </div>
                        <div>
                          <span className="text-slate-600 dark:text-slate-400">Matéria Orgânica</span>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{analysis.organicMatter}%</p>
                        </div>
                      </div>
                    </div>

                    {/* Comentários do Admin */}
                    {analysis.adminComments && (
                      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">
                          Comentários da Análise
                        </h4>
                        <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                          {analysis.adminComments}
                        </p>
                      </div>
                    )}

                    {/* Arquivos do Admin */}
                    {analysis.adminFileUrls && (
                      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <h4 className="font-semibold text-sm text-green-900 dark:text-green-100 mb-3">
                          Resultados e Relatórios
                        </h4>
                        <div className="space-y-2">
                          {analysis.adminFileUrls.split(";").map((file, idx) => (
                            file.trim() && (
                              <Button
                                key={idx}
                                variant="outline"
                                className="w-full justify-start text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                                onClick={() => handleDownloadFile(file.trim())}
                                data-testid={`button-download-file-${idx}`}
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                {file.trim()}
                              </Button>
                            )
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Data */}
                    <p className="text-xs text-slate-500">
                      Análise de {new Date(analysis.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
