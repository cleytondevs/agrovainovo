import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Beaker, Send, Upload } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const CROP_TYPES = [
  "Milho",
  "Pastagem",
  "Café",
  "Cacau",
  "Soja",
  "Trigo",
  "Arroz",
  "Cana-de-açúcar",
  "Algodão",
  "Feijão",
  "Hortifrúti",
  "Frutas",
  "Outro",
];

const CROP_AGES = [
  "Até 1 ano",
  "1 a 2 anos",
  "2 a 5 anos",
  "5 a 10 anos",
  "Mais de 10 anos",
];

const CROP_TYPES_PRODUCTION = [
  "Em produção",
  "Em crescimento",
  "A ser implantada",
];

const SAMPLE_DEPTHS = [
  "0-20cm",
  "20-40cm",
  "0-40cm",
];

const COLLECTION_BY = [
  "Proprietário",
  "Técnico",
];

const MOON_PHASES = [
  "Nova",
  "Crescente",
  "Cheia",
  "Minguante",
];

const soilAnalysisSchema = z.object({
  producerName: z.string().min(1, "Nome do produtor é obrigatório"),
  producerContact: z.string().min(1, "Contato do produtor é obrigatório"),
  producerAddress: z.string().min(1, "Endereço é obrigatório"),
  propertyName: z.string().min(1, "Nome da propriedade é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  cropType: z.string().min(1, "Tipo de cultura é obrigatório"),
  cropAge: z.string().min(1, "Idade da cultura é obrigatória"),
  productionType: z.string().min(1, "Tipo de lavoura é obrigatório"),
  spacing: z.string().optional(),
  area: z.string().min(1, "Área/hectare é obrigatária"),
  sampleDepth: z.string().min(1, "Profundidade da amostra é obrigatória"),
  collectedBy: z.string().min(1, "Informação sobre coleta é obrigatória"),
  fieldName: z.string().min(1, "Nome do campo é obrigatório"),
  moonPhase: z.string().optional(),
  relativeHumidity: z.string().refine((val) => !val || (parseFloat(val) >= 0 && parseFloat(val) <= 100), "Umidade deve estar entre 0 e 100%"),
  precipitation: z.string().refine((val) => !val || parseFloat(val) >= 0, "Precipitação deve ser positiva"),
  notes: z.string().optional(),
});

type SoilAnalysisFormValues = z.infer<typeof soilAnalysisSchema>;

interface SoilAnalysisProps {
  userEmail?: string;
}

export default function SoilAnalysis({ userEmail = "" }: SoilAnalysisProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedPdf, setUploadedPdf] = useState<string | null>(null);
  const [uploadedAttachments, setUploadedAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const form = useForm<SoilAnalysisFormValues>({
    resolver: zodResolver(soilAnalysisSchema),
    defaultValues: {
      producerName: "",
      producerContact: "",
      producerAddress: "",
      propertyName: "",
      city: "",
      cropType: "",
      cropAge: "",
      productionType: "",
      spacing: "",
      area: "",
      sampleDepth: "",
      collectedBy: "",
      fieldName: "",
      moonPhase: "",
      relativeHumidity: "",
      precipitation: "",
      notes: "",
    },
  });

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, envie um arquivo PDF.",
      });
      return;
    }

    setUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('soil-analysis-pdfs')
        .upload(fileName, file);

      if (error) throw error;

      setUploadedPdf(fileName);
      toast({
        title: "PDF enviado",
        description: "O arquivo foi enviado com sucesso.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: error.message || "Falha ao enviar PDF.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    try {
      const newAttachments: string[] = [];
      for (const file of Array.from(files)) {
        const fileName = `attachment-${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('soil-analysis-pdfs')
          .upload(fileName, file);

        if (error) throw error;
        newAttachments.push(fileName);
      }

      setUploadedAttachments([...uploadedAttachments, ...newAttachments]);
      toast({
        title: "Arquivo(s) enviado(s)",
        description: `${Array.from(files).length} arquivo(s) adicionado(s) com sucesso.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: error.message || "Falha ao enviar arquivo.",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index: number) => {
    setUploadedAttachments(uploadedAttachments.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: SoilAnalysisFormValues) => {
    setIsSubmitting(true);
    try {
      const { data: insertedData, error: sbError } = await supabase
        .from('soil_analysis')
        .insert([{
          field_name: data.fieldName,
          crop_type: data.cropType,
          producer_name: data.producerName,
          producer_contact: data.producerContact,
          producer_address: data.producerAddress,
          property_name: data.propertyName,
          city: data.city,
          crop_age: data.cropAge,
          production_type: data.productionType,
          spacing: data.spacing || "",
          area: data.area,
          sample_depth: data.sampleDepth,
          collected_by: data.collectedBy,
          moon_phase: data.moonPhase || "",
          relative_humidity: data.relativeHumidity ? parseFloat(data.relativeHumidity) : null,
          precipitation: data.precipitation ? parseFloat(data.precipitation) : null,
          notes: data.notes || "",
          soil_analysis_pdf: uploadedPdf || "",
          attachments: uploadedAttachments.join(";"),
          user_email: userEmail,
          status: "pending"
        }]);

      if (sbError) throw sbError;

      toast({
        title: "Análise enviada!",
        description: "Sua análise de solo foi enviada para revisão.",
      });

      form.reset();
      setUploadedPdf(null);
      setUploadedAttachments([]);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar",
        description: error.message || "Não foi possível enviar a análise.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <Card className="lg:col-span-2 border-none shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-lg">
                <Beaker className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl">Análise de Solo Completa</CardTitle>
                <CardDescription className="text-green-50">Insira os dados da análise de solo do seu campo</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Dados do Produtor */}
              <div className="space-y-4">
                <h3 className="font-semibold text-green-700 text-lg flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  Dados do Produtor
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="producerName" className="font-semibold">Nome*</Label>
                    <Input
                      id="producerName"
                      placeholder="Nome do produtor"
                      data-testid="input-producerName"
                      {...form.register("producerName")}
                    />
                    {form.formState.errors.producerName && (
                      <p className="text-sm text-red-600">{form.formState.errors.producerName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="producerContact" className="font-semibold">Contato*</Label>
                    <Input
                      id="producerContact"
                      placeholder="Telefone ou email"
                      data-testid="input-producerContact"
                      {...form.register("producerContact")}
                    />
                    {form.formState.errors.producerContact && (
                      <p className="text-sm text-red-600">{form.formState.errors.producerContact.message}</p>
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="producerAddress" className="font-semibold">Endereço*</Label>
                    <Input
                      id="producerAddress"
                      placeholder="Endereço completo"
                      data-testid="input-producerAddress"
                      {...form.register("producerAddress")}
                    />
                    {form.formState.errors.producerAddress && (
                      <p className="text-sm text-red-600">{form.formState.errors.producerAddress.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="propertyName" className="font-semibold">Propriedade*</Label>
                    <Input
                      id="propertyName"
                      placeholder="Nome da propriedade"
                      data-testid="input-propertyName"
                      {...form.register("propertyName")}
                    />
                    {form.formState.errors.propertyName && (
                      <p className="text-sm text-red-600">{form.formState.errors.propertyName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city" className="font-semibold">Cidade*</Label>
                    <Input
                      id="city"
                      placeholder="Cidade"
                      data-testid="input-city"
                      {...form.register("city")}
                    />
                    {form.formState.errors.city && (
                      <p className="text-sm text-red-600">{form.formState.errors.city.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Informações de Coleta */}
              <div className="space-y-4">
                <h3 className="font-semibold text-blue-700 text-lg flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  Informações de Coleta
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cropType" className="font-semibold">Cultura*</Label>
                    <Select value={form.watch("cropType")} onValueChange={(value) => form.setValue("cropType", value)}>
                      <SelectTrigger id="cropType" data-testid="select-cropType">
                        <SelectValue placeholder="Selecione a cultura" />
                      </SelectTrigger>
                      <SelectContent>
                        {CROP_TYPES.map((crop) => (
                          <SelectItem key={crop} value={crop}>
                            {crop}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.cropType && (
                      <p className="text-sm text-red-600">{form.formState.errors.cropType.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cropAge" className="font-semibold">Idade*</Label>
                    <Select value={form.watch("cropAge")} onValueChange={(value) => form.setValue("cropAge", value)}>
                      <SelectTrigger id="cropAge" data-testid="select-cropAge">
                        <SelectValue placeholder="Selecione a idade" />
                      </SelectTrigger>
                      <SelectContent>
                        {CROP_AGES.map((age) => (
                          <SelectItem key={age} value={age}>
                            {age}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.cropAge && (
                      <p className="text-sm text-red-600">{form.formState.errors.cropAge.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productionType" className="font-semibold">Tipo de Lavoura*</Label>
                    <Select value={form.watch("productionType")} onValueChange={(value) => form.setValue("productionType", value)}>
                      <SelectTrigger id="productionType" data-testid="select-productionType">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {CROP_TYPES_PRODUCTION.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.productionType && (
                      <p className="text-sm text-red-600">{form.formState.errors.productionType.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spacing">Espaçamento entre Plantas</Label>
                    <Input
                      id="spacing"
                      placeholder="Ex: 0.5m x 1m"
                      data-testid="input-spacing"
                      {...form.register("spacing")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="area" className="font-semibold">Área/Hectare*</Label>
                    <Input
                      id="area"
                      placeholder="Ex: 10 hectares"
                      data-testid="input-area"
                      {...form.register("area")}
                    />
                    {form.formState.errors.area && (
                      <p className="text-sm text-red-600">{form.formState.errors.area.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sampleDepth" className="font-semibold">Profundidade da Amostra*</Label>
                    <Select value={form.watch("sampleDepth")} onValueChange={(value) => form.setValue("sampleDepth", value)}>
                      <SelectTrigger id="sampleDepth" data-testid="select-sampleDepth">
                        <SelectValue placeholder="Selecione a profundidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {SAMPLE_DEPTHS.map((depth) => (
                          <SelectItem key={depth} value={depth}>
                            {depth}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.sampleDepth && (
                      <p className="text-sm text-red-600">{form.formState.errors.sampleDepth.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="collectedBy" className="font-semibold">Coleta Realizada Por*</Label>
                    <Select value={form.watch("collectedBy")} onValueChange={(value) => form.setValue("collectedBy", value)}>
                      <SelectTrigger id="collectedBy" data-testid="select-collectedBy">
                        <SelectValue placeholder="Selecione quem realizou" />
                      </SelectTrigger>
                      <SelectContent>
                        {COLLECTION_BY.map((by) => (
                          <SelectItem key={by} value={by}>
                            {by}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.collectedBy && (
                      <p className="text-sm text-red-600">{form.formState.errors.collectedBy.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Nome do Campo */}
              <div className="space-y-2">
                <Label htmlFor="fieldName" className="font-semibold">Nome do Campo/Talhão*</Label>
                <Input
                  id="fieldName"
                  placeholder="Ex: Talhão A - Zona 1"
                  data-testid="input-fieldName"
                  {...form.register("fieldName")}
                />
                {form.formState.errors.fieldName && (
                  <p className="text-sm text-red-600">{form.formState.errors.fieldName.message}</p>
                )}
              </div>

              {/* Upload PDF */}
              <div className="space-y-4">
                <h3 className="font-semibold text-purple-700 text-lg flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  Upload da Análise de Solo
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="pdfFile" className="font-semibold">Arquivo PDF</Label>
                  <div className="flex items-center gap-3">
                    <label htmlFor="pdfFile" className="flex-1">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-green-600 transition">
                        <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm font-medium text-gray-700">Clique para selecionar PDF</p>
                        <p className="text-xs text-gray-500">ou arraste o arquivo aqui</p>
                      </div>
                      <input
                        id="pdfFile"
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={handlePdfUpload}
                        disabled={uploading}
                        data-testid="input-pdfFile"
                      />
                    </label>
                  </div>
                  {uploadedPdf && (
                    <p className="text-xs text-green-600 mt-2">✓ PDF selecionado</p>
                  )}
                </div>
              </div>

              {/* Upload Arquivos Adicionais */}
              <div className="space-y-4">
                <h3 className="font-semibold text-blue-700 text-lg flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  Arquivos Adicionais
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="attachments">Upload de Arquivos (Opcional)</Label>
                  <div className="flex items-center gap-3">
                    <label htmlFor="attachments" className="flex-1">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-600 transition">
                        <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm font-medium text-gray-700">Clique para adicionar arquivos</p>
                        <p className="text-xs text-gray-500">Qualquer formato (PDF, imagens, documentos)</p>
                      </div>
                      <input
                        id="attachments"
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleAttachmentUpload}
                        disabled={uploading}
                        data-testid="input-attachments"
                      />
                    </label>
                  </div>
                  {uploadedAttachments.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <Label className="text-sm font-semibold">Arquivos adicionados:</Label>
                      {uploadedAttachments.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/20 p-3 rounded border border-blue-200">
                          <span className="text-sm text-gray-700">{file.split('-').slice(2).join('-')}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeAttachment(idx)}
                            data-testid={`button-remove-attachment-${idx}`}
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notas e Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Adicione observações relevantes sobre a análise..."
                  data-testid="input-notes"
                  {...form.register("notes")}
                  className="min-h-24 resize-none"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
                disabled={isSubmitting}
                data-testid="button-submit-analysis"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar para Análise
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
