import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, FileUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
}

export function AdminAnalysisModal({
  open,
  analysis,
  onClose,
  onSubmit,
}: AdminAnalysisModalProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState("pending");
  const [comments, setComments] = useState("");
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploadingFile(true);
    try {
      // Create file URLs using a simple base64 approach for demo
      // In production, use Supabase Storage
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const reader = new FileReader();
        reader.onload = () => {
          newUrls.push(file.name);
        };
        reader.readAsArrayBuffer(file);
      }
      
      // For now, just store file names
      setFileUrls([...fileUrls, ...Array.from(files).map(f => f.name)]);
      toast({ title: "Arquivo adicionado", description: `${Array.from(files).length} arquivo(s) selecionado(s)` });
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

  if (!analysis) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Analisar Submissão - {analysis.fieldName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Analysis Data */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Email</Label>
                  <p className="font-medium">{analysis.userEmail}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Cultura</Label>
                  <p className="font-medium">{analysis.cropType}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">pH</Label>
                  <p className="font-medium">{analysis.pH}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Nitrogênio</Label>
                  <p className="font-medium">{analysis.nitrogen} ppm</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Fósforo</Label>
                  <p className="font-medium">{analysis.phosphorus} ppm</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Potássio</Label>
                  <p className="font-medium">{analysis.potassium} ppm</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Umidade</Label>
                  <p className="font-medium">{analysis.moisture}%</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Matéria Orgânica</Label>
                  <p className="font-medium">{analysis.organicMatter}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

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
          <Button variant="outline" onClick={onClose} disabled={isLoading} data-testid="button-cancel-analysis">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} data-testid="button-save-analysis">
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar Análise
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
