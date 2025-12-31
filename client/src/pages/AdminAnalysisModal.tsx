import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, FileUp, Download, CheckCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import type { SoilAnalysis } from "@shared/schema";

interface AdminAnalysisModalProps {
  open: boolean;
  analysis: SoilAnalysis | null;
  onClose: () => void;
  onSubmit: (data: {
    status: string;
    adminComments: string;
    adminFileUrls: string;
  }) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
}

export function AdminAnalysisModal({
  open,
  analysis: rawAnalysis,
  onClose,
  onSubmit,
  onDelete,
}: AdminAnalysisModalProps) {
  const analysis = rawAnalysis as any;
  const { toast } = useToast();
  const [status, setStatus] = useState("pending");
  const [comments, setComments] = useState("");
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize form with analysis data
  useEffect(() => {
    if (analysis) {
      setStatus(analysis.status || "pending");
      setComments(analysis.adminComments || "");
      setFileUrls(Array.isArray(analysis.adminFileUrls) ? analysis.adminFileUrls : (analysis.adminFileUrls ? [analysis.adminFileUrls] : []));
    }
  }, [analysis?.id]);

  const handleDownloadPdf = async () => {
    if (!analysis?.soil_analysis_pdf) {
      toast({ variant: "destructive", title: "Erro", description: "Nenhum PDF disponível" });
      return;
    }

    const { data: client, error: clientError } = await (async () => {
      try {
        const c = await (supabase as any);
        return { data: c, error: null };
      } catch (e: any) {
        return { data: null, error: e };
      }
    })();

    if (clientError || !client) {
      toast({ variant: "destructive", title: "Erro", description: "Cliente Supabase não inicializado" });
      return;
    }

    setDownloadingPdf(true);
    try {
      const { data, error } = await client.storage
        .from('soil-analysis-pdfs')
        .download(analysis.soil_analysis_pdf);
      
      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analise-solo-${analysis.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: "PDF baixado", description: "Arquivo salvo com sucesso" });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao baixar PDF" });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const { data: client, error: clientError } = await (async () => {
      try {
        const c = await (supabase as any);
        return { data: c, error: null };
      } catch (e: any) {
        return { data: null, error: e };
      }
    })();

    if (clientError || !client) {
      toast({ variant: "destructive", title: "Erro", description: "Cliente Supabase não inicializado" });
      return;
    }

    setUploadingFile(true);
    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const fileName = `report-${Date.now()}-${file.name}`;
        const { data, error } = await client.storage
          .from('soil-analysis-pdfs')
          .upload(fileName, file);

        if (error) throw error;
        newUrls.push(fileName);
      }
      
      setFileUrls([...fileUrls, ...newUrls]);
      toast({ title: "Arquivo adicionado", description: `${Array.from(files).length} arquivo(s) adicionado(s)` });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao processar arquivo" });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async () => {
    if (!status) {
      toast({ variant: "destructive", title: "Erro", description: "Selecione um status" });
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        status,
        adminComments: comments,
        adminFileUrls: fileUrls.join(";"),
      });
      
      // Reset form
      setStatus("pending");
      setComments("");
      setFileUrls([]);
      onClose();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao salvar análise" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!analysis || !onDelete) return;
    
    const confirmed = window.confirm(
      "Tem certeza que deseja deletar esta análise? Esta ação não pode ser desfeita."
    );
    
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await onDelete(analysis.id);
      toast({ title: "Análise deletada", description: "A análise foi removida com sucesso" });
      onClose();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao deletar análise" });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!analysis) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Analisar Submissão - {analysis.fieldName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Producer Data */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-green-700 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                Dados do Produtor
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Nome</Label>
                  <p className="font-medium">{analysis.producer_name || "-"}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Contato</Label>
                  <p className="font-medium">{analysis.producer_contact || "-"}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-slate-500">Endereço</Label>
                  <p className="font-medium">{analysis.producer_address || "-"}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Propriedade</Label>
                  <p className="font-medium">{analysis.property_name || "-"}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Cidade</Label>
                  <p className="font-medium">{analysis.city || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Collection Data */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-blue-700 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                Informações de Coleta
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Cultura</Label>
                  <p className="font-medium">{analysis.cropType}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Idade</Label>
                  <p className="font-medium">{analysis.crop_age || "-"}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Tipo de Lavoura</Label>
                  <p className="font-medium">{analysis.production_type || "-"}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Espaçamento</Label>
                  <p className="font-medium">{analysis.spacing || "-"}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Área/Hectare</Label>
                  <p className="font-medium">{analysis.area || "-"}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Profundidade da Amostra</Label>
                  <p className="font-medium">{analysis.sample_depth || "-"}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-slate-500">Coleta Realizada Por</Label>
                  <p className="font-medium">{analysis.collected_by || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PDF Download */}
          {analysis.soil_analysis_pdf && (
            <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs text-slate-500">PDF da Análise Enviado</Label>
                    <p className="font-medium text-green-700 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Arquivo disponível
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleDownloadPdf}
                    disabled={downloadingPdf}
                    className="border-purple-300 hover:bg-purple-100"
                    data-testid="button-download-pdf"
                  >
                    {downloadingPdf ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Baixando...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Baixar PDF
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Attachments */}
          {analysis.attachments && (
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <CardContent className="pt-6">
                <h4 className="font-semibold text-blue-700 mb-3">Arquivos Adicionais do Produtor</h4>
                <div className="space-y-2">
                  {analysis.attachments.split(";").filter((f: string) => f).map((file: string, idx: number) => (
                    <div key={idx} className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded border border-blue-100">
                      <span className="text-sm truncate">{file.split('-').slice(2).join('-')}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-blue-600"
                        data-testid={`button-download-attachment-${idx}`}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Selection */}
          <div>
            <Label htmlFor="status">Status da Análise</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger data-testid="select-analysis-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Comments */}
          <div>
            <Label htmlFor="comments">Comentários da Análise</Label>
            <Textarea
              id="comments"
              placeholder="Adicione suas observações, sugestões ou motivos de rejeição..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              data-testid="textarea-admin-comments"
            />
          </div>

          {/* File Upload */}
          <div>
            <Label>Resultados e Relatórios</Label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
              <FileUp className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <Input
                type="file"
                multiple
                onChange={handleFileUpload}
                disabled={uploadingFile}
                className="hidden"
                id="file-input"
                data-testid="input-file-upload"
              />
              <label htmlFor="file-input" className="cursor-pointer">
                <Button
                  type="button"
                  variant="outline"
                  className="pointer-events-none"
                  disabled={uploadingFile}
                >
                  {uploadingFile ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <FileUp className="w-4 h-4 mr-2" />
                      Selecionar arquivos
                    </>
                  )}
                </Button>
              </label>
              <p className="text-xs text-slate-500 mt-2">
                PDF, DOC, XLSX, imagens e outros formatos suportados
              </p>
            </div>

            {/* File List */}
            {fileUrls.length > 0 && (
              <div className="mt-3 space-y-2">
                <Label className="text-xs text-slate-500">Arquivos selecionados:</Label>
                {fileUrls.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-2 rounded">
                    <span className="text-sm font-medium truncate">{file}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setFileUrls(fileUrls.filter((_, i) => i !== idx))}
                      data-testid={`button-remove-file-${idx}`}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          {onDelete && (
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={isLoading || isDeleting}
              className="mr-auto"
              data-testid="button-delete-analysis"
            >
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Trash2 className="w-4 h-4 mr-2" />
              Deletar Análise
            </Button>
          )}
          <Button variant="outline" onClick={onClose} disabled={isLoading || isDeleting} data-testid="button-cancel-analysis">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || isDeleting} data-testid="button-save-analysis">
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar Análise
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
