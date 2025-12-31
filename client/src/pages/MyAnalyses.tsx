import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogOut, FileText, Clock, CheckCircle2, XCircle, Loader2, Download, Trash2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
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

  const { data: analyses = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/soil-analysis/user", user?.email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('soil_analysis')
        .select('*')
        .eq('user_email', user?.email)
        .neq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Map database snake_case to camelCase for frontend
      return (data || []).map((a: any) => ({
        ...a,
        fieldName: a.field_name,
        cropType: a.crop_type,
        userEmail: a.user_email,
        producerName: a.producer_name,
        propertyName: a.property_name,
        cropAge: a.crop_age,
        productionType: a.production_type,
        sampleDepth: a.sample_depth,
        collectedBy: a.collected_by,
        organicMatter: a.organic_matter,
        adminComments: a.admin_comments,
        adminFileUrls: a.admin_file_urls,
        updatedAt: a.updated_at,
        createdAt: a.created_at
      }));
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

  const deleteAnalysisMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('soil_analysis').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/soil-analysis/user", user?.email] });
      toast({ title: "Análise deletada", description: "A análise foi removida com sucesso" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao deletar análise" });
    },
  });

  const handleDeleteAnalysis = (id: number) => {
    const confirmed = window.confirm(
      "Tem certeza que deseja deletar esta análise? Esta ação não pode ser desfeita."
    );
    if (confirmed) {
      deleteAnalysisMutation.mutate(id);
    }
  };

  const handleDownloadFile = async (fileName: string) => {
    try {
      toast({ 
        title: "Preparando download...", 
        description: "Gerando link de acesso..." 
      });

      const { data, error } = await supabase.storage
        .from('soil-analysis-pdfs')
        .download(fileName);

      if (error) {
        console.error('Download error:', error);
        throw error;
      }

      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName.split("/").pop() || "analise.pdf");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ 
        title: "Download completo", 
        description: "Arquivo salvo com sucesso." 
      });
    } catch (error) {
      console.error("Erro ao baixar arquivo:", error);
      toast({ 
        variant: "destructive",
        title: "Erro no download", 
        description: "Não foi possível baixar o arquivo. Tente novamente." 
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setLocation("/dashboard")} data-testid="button-back-dashboard">
              Voltar ao Dashboard
            </Button>
            <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
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
                    {/* Dados do Produtor (Opcional se houver) */}
                    {(analysis.producerName || analysis.propertyName) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                        {analysis.producerName && (
                          <div>
                            <span className="text-slate-600 dark:text-slate-400">Produtor:</span>
                            <p className="font-medium text-slate-900 dark:text-slate-100">{analysis.producerName}</p>
                          </div>
                        )}
                        {analysis.propertyName && (
                          <div>
                            <span className="text-slate-600 dark:text-slate-400">Propriedade:</span>
                            <p className="font-medium text-slate-900 dark:text-slate-100">{analysis.propertyName}</p>
                          </div>
                        )}
                      </div>
                    )}

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
                    {analysis.adminFileUrls && Array.isArray(analysis.adminFileUrls) && analysis.adminFileUrls.length > 0 && (
                      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <h4 className="font-semibold text-sm text-green-900 dark:text-green-100 mb-3">
                          Resultados e Relatórios
                        </h4>
                        <div className="space-y-2">
                          {analysis.adminFileUrls.map((file: string, idx: number) => (
                            file.trim() && (
                              <Button
                                key={idx}
                                variant="outline"
                                className="w-full justify-start text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900"
                                onClick={() => handleDownloadFile(file.trim())}
                                data-testid={`button-download-file-${idx}`}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                {file.trim().split('/').pop() || file.trim()}
                              </Button>
                            )
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Data and Delete Button */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500">
                        Análise de {analysis.createdAt ? new Date(analysis.createdAt).toLocaleDateString("pt-BR") : "Data não disponível"}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => handleDeleteAnalysis(analysis.id)}
                        disabled={deleteAnalysisMutation.isPending}
                        data-testid={`button-delete-analysis-${analysis.id}`}
                      >
                        {deleteAnalysisMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
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
