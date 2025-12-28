import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, AlertCircle, CheckCircle2, TrendingUp, Leaf } from "lucide-react";

export default function SoilMaterials() {
  return (
    <div className="space-y-8">
      {/* Introdução */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-green-600" />
          <h1 className="text-4xl font-bold text-secondary">Guia Completo de Análise de Solo</h1>
        </div>
        <Card className="border-none shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="pt-6">
            <p className="text-base leading-relaxed text-slate-700">
              A análise de solo é fundamental para o sucesso da produção agrícola. Ela fornece informações essenciais sobre a fertilidade, estrutura e capacidade de retenção de nutrientes do solo, permitindo decisões precisas sobre adubação e manejo.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* pH do Solo */}
      <section className="space-y-4">
        <h2 className="text-3xl font-bold text-secondary flex items-center gap-2">
          <div className="w-1 h-8 bg-blue-600 rounded"></div>
          pH do Solo
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-md">
            <CardHeader className="bg-blue-100">
              <CardTitle className="text-sm text-blue-900">Escala de pH</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div>
                <p className="font-semibold text-blue-700">Muito Ácido</p>
                <p className="text-sm text-slate-600">pH 4.0 - 5.0</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700">Ácido</p>
                <p className="text-sm text-slate-600">pH 5.0 - 6.5</p>
              </div>
              <div>
                <p className="font-semibold text-green-700">Neutro (Ideal)</p>
                <p className="text-sm text-slate-600">pH 6.5 - 7.5</p>
              </div>
              <div>
                <p className="font-semibold text-orange-700">Alcalino</p>
                <p className="text-sm text-slate-600">pH 7.5 - 9.0</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader className="bg-green-100">
              <CardTitle className="text-sm text-green-900">Importância</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-2 text-sm">
              <p><CheckCircle2 className="inline mr-2 h-4 w-4 text-green-600" />Controla disponibilidade de nutrientes</p>
              <p><CheckCircle2 className="inline mr-2 h-4 w-4 text-green-600" />Afeta a atividade microbiana</p>
              <p><CheckCircle2 className="inline mr-2 h-4 w-4 text-green-600" />Influencia estrutura do solo</p>
              <p><CheckCircle2 className="inline mr-2 h-4 w-4 text-green-600" />Determina escolha de culturas</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader className="bg-amber-100">
              <CardTitle className="text-sm text-amber-900">Recomendações</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-2 text-sm">
              <p><Leaf className="inline mr-2 h-4 w-4 text-amber-600" /><span className="font-semibold">Corretivo:</span> Calcário dolomítico</p>
              <p><Leaf className="inline mr-2 h-4 w-4 text-amber-600" /><span className="font-semibold">Taxa:</span> 1-3 ton/ha/ano</p>
              <p><Leaf className="inline mr-2 h-4 w-4 text-amber-600" /><span className="font-semibold">Aplicação:</span> 3-6 meses antes</p>
              <p><Leaf className="inline mr-2 h-4 w-4 text-amber-600" /><span className="font-semibold">Frequência:</span> A cada 3-4 anos</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Macronutrientes */}
      <section className="space-y-4">
        <h2 className="text-3xl font-bold text-secondary flex items-center gap-2">
          <div className="w-1 h-8 bg-green-600 rounded"></div>
          Macronutrientes (NPK)
        </h2>
        <p className="text-slate-700">Os três nutrientes primários essenciais para o crescimento das plantas.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Nitrogênio */}
          <Card className="border-2 border-green-200 shadow-md">
            <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardTitle>Nitrogênio (N)</CardTitle>
              <CardDescription className="text-green-50">Componente proteico</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div>
                <p className="font-semibold text-sm text-slate-600">Valores Ideais</p>
                <p className="text-lg font-bold text-green-700">20-40 mg/dm³</p>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-sm">Funções:</p>
                <ul className="text-sm space-y-1 text-slate-700">
                  <li>• Formação de proteínas e aminoácidos</li>
                  <li>• Crescimento da biomassa</li>
                  <li>• Pigmentação verde das folhas</li>
                  <li>• Desenvolvimento vegetal rápido</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-sm">Deficiência:</p>
                <p className="text-sm text-slate-700">Amarelecimento das folhas, baixo crescimento</p>
              </div>
            </CardContent>
          </Card>

          {/* Fósforo */}
          <Card className="border-2 border-blue-200 shadow-md">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardTitle>Fósforo (P)</CardTitle>
              <CardDescription className="text-blue-50">Energia e reprodução</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div>
                <p className="font-semibold text-sm text-slate-600">Valores Ideais</p>
                <p className="text-lg font-bold text-blue-700">15-40 mg/dm³</p>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-sm">Funções:</p>
                <ul className="text-sm space-y-1 text-slate-700">
                  <li>• Transferência de energia (ATP)</li>
                  <li>• Formação de raízes fortes</li>
                  <li>• Floração e frutificação</li>
                  <li>• Metabolismo energético</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-sm">Deficiência:</p>
                <p className="text-sm text-slate-700">Atraso no florescimento, raízes fracas</p>
              </div>
            </CardContent>
          </Card>

          {/* Potássio */}
          <Card className="border-2 border-amber-200 shadow-md">
            <CardHeader className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
              <CardTitle>Potássio (K)</CardTitle>
              <CardDescription className="text-amber-50">Qualidade e resistência</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div>
                <p className="font-semibold text-sm text-slate-600">Valores Ideais</p>
                <p className="text-lg font-bold text-amber-700">150-200 mg/dm³</p>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-sm">Funções:</p>
                <ul className="text-sm space-y-1 text-slate-700">
                  <li>• Resistência a doenças e pestes</li>
                  <li>• Qualidade dos frutos e sementes</li>
                  <li>• Regulação hídrica das plantas</li>
                  <li>• Translocação de açúcares</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-sm">Deficiência:</p>
                <p className="text-sm text-slate-700">Frutos pequenos, baixa resistência</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Micronutrientes */}
      <section className="space-y-4">
        <h2 className="text-3xl font-bold text-secondary flex items-center gap-2">
          <div className="w-1 h-8 bg-purple-600 rounded"></div>
          Micronutrientes
        </h2>
        <p className="text-slate-700">Nutrientes necessários em menores quantidades, mas igualmente importantes.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: "Boro (B)", range: "0.5-1.5 mg/dm³", role: "Floração, polinização" },
            { name: "Cobre (Cu)", range: "0.5-1.5 mg/dm³", role: "Ativação enzimática" },
            { name: "Ferro (Fe)", range: "4-12 mg/dm³", role: "Fotossíntese, clorofila" },
            { name: "Manganês (Mn)", range: "3-8 mg/dm³", role: "Metabolismo proteico" },
            { name: "Molibdênio (Mo)", range: "0.1-0.3 mg/dm³", role: "Fixação de nitrogênio" },
            { name: "Zinco (Zn)", range: "2-5 mg/dm³", role: "Síntese de proteínas" },
          ].map((nutrient) => (
            <Card key={nutrient.name} className="border-none shadow-md">
              <CardContent className="pt-6">
                <h3 className="font-bold text-slate-900 mb-2">{nutrient.name}</h3>
                <p className="text-sm text-purple-600 font-semibold mb-2">{nutrient.range}</p>
                <p className="text-sm text-slate-700">{nutrient.role}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Propriedades Físicas */}
      <section className="space-y-4">
        <h2 className="text-3xl font-bold text-secondary flex items-center gap-2">
          <div className="w-1 h-8 bg-orange-600 rounded"></div>
          Propriedades Físico-Químicas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Umidade */}
          <Card className="border-none shadow-md">
            <CardHeader className="bg-blue-100">
              <CardTitle className="text-blue-900">Umidade do Solo</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div className="space-y-2">
                <p className="font-semibold">Classificação:</p>
                <div className="space-y-1 text-sm">
                  <p><Badge>15-25%</Badge> Seco</p>
                  <p><Badge variant="secondary">25-35%</Badge> Ótimo</p>
                  <p><Badge className="bg-amber-500">35-50%</Badge> Úmido</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="font-semibold">Importância:</p>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>✓ Disponibilidade de nutrientes</li>
                  <li>✓ Atividade microbiana</li>
                  <li>✓ Aeração do solo</li>
                  <li>✓ Absorção radicular</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Matéria Orgânica */}
          <Card className="border-none shadow-md">
            <CardHeader className="bg-amber-100">
              <CardTitle className="text-amber-900">Matéria Orgânica</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div className="space-y-2">
                <p className="font-semibold">Classificação:</p>
                <div className="space-y-1 text-sm">
                  <p><Badge>0-2%</Badge> Baixa</p>
                  <p><Badge variant="secondary">2-4%</Badge> Média</p>
                  <p><Badge className="bg-green-500">4%+</Badge> Alta</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="font-semibold">Benefícios:</p>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>✓ Retenção de água</li>
                  <li>✓ Estrutura agregada</li>
                  <li>✓ Fonte de nutrientes</li>
                  <li>✓ Biota microbiana</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Recomendações Práticas */}
      <section className="space-y-4">
        <h2 className="text-3xl font-bold text-secondary flex items-center gap-2">
          <TrendingUp className="h-8 w-8 text-green-600" />
          Recomendações Práticas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-l-4 border-l-green-500 shadow-md">
            <CardHeader>
              <CardTitle className="text-green-700">Coleta de Amostras</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><CheckCircle2 className="inline mr-2 h-4 w-4" />Coletar 15-20 sub-amostras por área</p>
              <p><CheckCircle2 className="inline mr-2 h-4 w-4" />Profundidade: 0-20 cm para cultura anual</p>
              <p><CheckCircle2 className="inline mr-2 h-4 w-4" />Evitar áreas não representativas</p>
              <p><CheckCircle2 className="inline mr-2 h-4 w-4" />Fazer análises a cada 2-3 anos</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 shadow-md">
            <CardHeader>
              <CardTitle className="text-blue-700">Interpretação de Resultados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><CheckCircle2 className="inline mr-2 h-4 w-4" />Comparar com tabelas de recomendação</p>
              <p><CheckCircle2 className="inline mr-2 h-4 w-4" />Considerar história da área</p>
              <p><CheckCircle2 className="inline mr-2 h-4 w-4" />Avaliar relação de nutrientes</p>
              <p><CheckCircle2 className="inline mr-2 h-4 w-4" />Basear adubação em resultados</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500 shadow-md">
            <CardHeader>
              <CardTitle className="text-amber-700">Correções de Solo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><Leaf className="inline mr-2 h-4 w-4" /><span className="font-semibold">pH baixo:</span> Aplicar calcário</p>
              <p><Leaf className="inline mr-2 h-4 w-4" /><span className="font-semibold">Baixo NPK:</span> Adubação balanceada</p>
              <p><Leaf className="inline mr-2 h-4 w-4" /><span className="font-semibold">M.O. baixa:</span> Adicionar matéria orgânica</p>
              <p><Leaf className="inline mr-2 h-4 w-4" /><span className="font-semibold">Desequilíbrio:</span> Complementar micronutrientes</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 shadow-md">
            <CardHeader>
              <CardTitle className="text-purple-700">Melhorias Contínuas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><CheckCircle2 className="inline mr-2 h-4 w-4" />Rotação de culturas</p>
              <p><CheckCircle2 className="inline mr-2 h-4 w-4" />Cobertura vegetal</p>
              <p><CheckCircle2 className="inline mr-2 h-4 w-4" />Compostagem e adubação verde</p>
              <p><CheckCircle2 className="inline mr-2 h-4 w-4" />Manejo conservacionista</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tabela de Interpretação */}
      <section className="space-y-4">
        <h2 className="text-3xl font-bold text-secondary flex items-center gap-2">
          <AlertCircle className="h-8 w-8 text-orange-600" />
          Interpretação de Teores
        </h2>

        <Card className="border-none shadow-lg overflow-hidden">
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">Nutriente</th>
                    <th className="px-4 py-2 text-center font-semibold">Baixo</th>
                    <th className="px-4 py-2 text-center font-semibold">Médio</th>
                    <th className="px-4 py-2 text-center font-semibold">Bom</th>
                    <th className="px-4 py-2 text-center font-semibold">Alto</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold">Nitrogênio</td>
                    <td className="px-4 py-3 text-center text-red-600">&lt;15</td>
                    <td className="px-4 py-3 text-center text-orange-600">15-25</td>
                    <td className="px-4 py-3 text-center text-green-600">25-40</td>
                    <td className="px-4 py-3 text-center text-blue-600">&gt;40</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold">Fósforo</td>
                    <td className="px-4 py-3 text-center text-red-600">&lt;10</td>
                    <td className="px-4 py-3 text-center text-orange-600">10-15</td>
                    <td className="px-4 py-3 text-center text-green-600">15-40</td>
                    <td className="px-4 py-3 text-center text-blue-600">&gt;40</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold">Potássio</td>
                    <td className="px-4 py-3 text-center text-red-600">&lt;100</td>
                    <td className="px-4 py-3 text-center text-orange-600">100-150</td>
                    <td className="px-4 py-3 text-center text-green-600">150-200</td>
                    <td className="px-4 py-3 text-center text-blue-600">&gt;200</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold">pH</td>
                    <td className="px-4 py-3 text-center text-red-600">&lt;5.0</td>
                    <td className="px-4 py-3 text-center text-orange-600">5.0-6.5</td>
                    <td className="px-4 py-3 text-center text-green-600">6.5-7.5</td>
                    <td className="px-4 py-3 text-center text-blue-600">&gt;7.5</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold">M.O.</td>
                    <td className="px-4 py-3 text-center text-red-600">&lt;2%</td>
                    <td className="px-4 py-3 text-center text-orange-600">2-3%</td>
                    <td className="px-4 py-3 text-center text-green-600">3-5%</td>
                    <td className="px-4 py-3 text-center text-blue-600">&gt;5%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
