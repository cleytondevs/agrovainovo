import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Beaker, Send } from "lucide-react";

const soilAnalysisSchema = z.object({
  fieldName: z.string().min(1, "Nome do campo é obrigatório"),
  pH: z.string().refine((val) => !val || (parseFloat(val) >= 0 && parseFloat(val) <= 14), "pH deve estar entre 0 e 14"),
  nitrogen: z.string().refine((val) => !val || parseFloat(val) >= 0, "Nitrogênio deve ser positivo"),
  phosphorus: z.string().refine((val) => !val || parseFloat(val) >= 0, "Fósforo deve ser positivo"),
  potassium: z.string().refine((val) => !val || parseFloat(val) >= 0, "Potássio deve ser positivo"),
  moisture: z.string().refine((val) => !val || parseFloat(val) >= 0, "Umidade deve ser positiva"),
  organicMatter: z.string().refine((val) => !val || parseFloat(val) >= 0, "Matéria orgânica deve ser positiva"),
  notes: z.string().optional(),
});

type SoilAnalysisFormValues = z.infer<typeof soilAnalysisSchema>;

interface SoilAnalysisProps {
  userEmail?: string;
}

export default function SoilAnalysis({ userEmail = "" }: SoilAnalysisProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SoilAnalysisFormValues>({
    resolver: zodResolver(soilAnalysisSchema),
    defaultValues: {
      fieldName: "",
      pH: "",
      nitrogen: "",
      phosphorus: "",
      potassium: "",
      moisture: "",
      organicMatter: "",
      notes: "",
    },
  });

  const onSubmit = async (data: SoilAnalysisFormValues) => {
    setIsSubmitting(true);
    try {
      // Prepare the analysis data
      const analysisData = {
        fieldName: data.fieldName,
        pH: data.pH ? parseFloat(data.pH) : null,
        nitrogen: data.nitrogen ? parseFloat(data.nitrogen) : null,
        phosphorus: data.phosphorus ? parseFloat(data.phosphorus) : null,
        potassium: data.potassium ? parseFloat(data.potassium) : null,
        moisture: data.moisture ? parseFloat(data.moisture) : null,
        organicMatter: data.organicMatter ? parseFloat(data.organicMatter) : null,
        notes: data.notes || "",
        userEmail,
        status: "pending",
      };

      // Send to backend
      const response = await fetch("/api/soil-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(analysisData),
      });

      if (!response.ok) throw new Error("Falha ao enviar análise");

      toast({
        title: "Análise enviada!",
        description: "Sua análise de solo foi enviada para revisão.",
      });

      form.reset();
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
              {/* Field Name */}
              <div className="space-y-2">
                <Label htmlFor="fieldName" className="font-semibold">Nome do Campo*</Label>
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

              {/* pH Level */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pH" className="font-semibold">pH do Solo</Label>
                  <Input
                    id="pH"
                    type="number"
                    step="0.1"
                    min="0"
                    max="14"
                    placeholder="Ex: 6.5"
                    data-testid="input-pH"
                    {...form.register("pH")}
                  />
                  {form.formState.errors.pH && (
                    <p className="text-sm text-red-600">{form.formState.errors.pH.message}</p>
                  )}
                </div>
              </div>

              {/* NPK Nutrients */}
              <div className="space-y-3">
                <h3 className="font-semibold text-green-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  Macronutrientes (mg/dm³)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nitrogen">Nitrogênio (N)</Label>
                    <Input
                      id="nitrogen"
                      type="number"
                      step="0.01"
                      placeholder="mg/dm³"
                      data-testid="input-nitrogen"
                      {...form.register("nitrogen")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phosphorus">Fósforo (P)</Label>
                    <Input
                      id="phosphorus"
                      type="number"
                      step="0.01"
                      placeholder="mg/dm³"
                      data-testid="input-phosphorus"
                      {...form.register("phosphorus")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="potassium">Potássio (K)</Label>
                    <Input
                      id="potassium"
                      type="number"
                      step="0.01"
                      placeholder="mg/dm³"
                      data-testid="input-potassium"
                      {...form.register("potassium")}
                    />
                  </div>
                </div>
              </div>

              {/* Moisture and Organic Matter */}
              <div className="space-y-3">
                <h3 className="font-semibold text-amber-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                  Propriedades Físico-Químicas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="moisture">Umidade (%)</Label>
                    <Input
                      id="moisture"
                      type="number"
                      step="0.1"
                      placeholder="0-100%"
                      data-testid="input-moisture"
                      {...form.register("moisture")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="organicMatter">Matéria Orgânica (%)</Label>
                    <Input
                      id="organicMatter"
                      type="number"
                      step="0.1"
                      placeholder="0-100%"
                      data-testid="input-organicMatter"
                      {...form.register("organicMatter")}
                    />
                  </div>
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

        {/* Info Cards */}
        <div className="space-y-4">
          <Card className="border-none shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-green-700">pH Ideal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="font-semibold">Ácido:</span> 4.0 - 6.5</p>
              <p><span className="font-semibold">Neutro:</span> 6.5 - 7.5</p>
              <p><span className="font-semibold">Alcalino:</span> 7.5 - 9.0</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-blue-700">Umidade Ideal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="font-semibold">Baixa:</span> 15 - 25%</p>
              <p><span className="font-semibold">Média:</span> 25 - 35%</p>
              <p><span className="font-semibold">Alta:</span> 35 - 50%</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-amber-50 to-orange-50">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-amber-700">Matéria Orgânica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="font-semibold">Baixa:</span> &lt; 2%</p>
              <p><span className="font-semibold">Média:</span> 2 - 4%</p>
              <p><span className="font-semibold">Alta:</span> &gt; 4%</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
