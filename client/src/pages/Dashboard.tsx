import { supabase } from "@/lib/supabaseClient";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  LogOut, 
  LayoutDashboard, 
  Sprout, 
  CloudSun, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Info,
  Menu,
  MapPin,
  TrendingUp,
  CheckCircle2
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha curta"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Agenda de dicas agronômicas por mês
const agronomicTips: Record<string, string[]> = {
  "Janeiro": ["Preparo do solo para safrinha", "Monitoramento de lagartas na soja", "Controle de invasoras", "Planejamento de fertilização"],
  "Fevereiro": ["Início da colheita de soja", "Plantio de milho safrinha", "Atenção ao percevejo", "Manutenção de colheitadeiras"],
  "Março": ["Finalização do plantio do milho", "Controle de ferrugem asiática", "Monitoramento hídrico", "Análise de sementes"],
  "Abril": ["Monitoramento de milho safrinha", "Vazio sanitário da soja", "Manutenção de sistemas de irrigação", "Adubação de cobertura"],
  "Maio": ["Controle de pragas no milho", "Planejamento da safra de verão", "Revisão de estoque de insumos", "Atenção a geadas precoces"],
  "Junho": ["Início da colheita do milho", "Preparo de solo para trigo", "Cuidado com doenças de solo", "Análise de mercado"],
  "Julho": ["Colheita intensiva de milho", "Plantio de culturas de inverno", "Manutenção preventiva de frota", "Planejamento financeiro"],
  "Agosto": ["Preparo antecipado para soja", "Tratamento de sementes", "Calagem e gessagem", "Acompanhamento climático"],
  "Setembro": ["Início do plantio de soja", "Atenção à umidade do solo", "Controle de plantas daninhas", "Regulagem de plantadeiras"],
  "Outubro": ["Plantio intensivo de soja", "Monitoramento de emergência de plantas", "Adubação nitrogenada", "Gestão de mão de obra"],
  "Novembro": ["Tratos culturais na soja", "Controle preventivo de fungos", "Monitoramento de pragas iniciais", "Gestão de pulverização"],
  "Dezembro": ["Fechamento de entrelinhas na soja", "Atenção ao estresse hídrico", "Planejamento da colheita", "Monitoramento de doenças foliares"]
};

// Dicas específicas por dia (Exemplo para ilustrar a funcionalidade)
const getDailyTip = (day: number, month: string) => {
  const tips = [
    "Ideal para vistoria técnica de campo.",
    "Ótimo dia para aplicação de defensivos.",
    "Verificar níveis de umidade do solo.",
    "Realizar manutenção preventiva de maquinário.",
    "Dia recomendado para análise foliar.",
    "Planejar logística de transporte de safra.",
    "Monitorar pressão de pragas e doenças."
  ];
  return tips[day % tips.length];
};

const months = Object.keys(agronomicTips);

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [currentMonthIndex, setCurrentMonthIndex] = useState(new Date().getMonth());

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (e) {
        console.error("Auth check failed", e);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const onLogin = async (data: LoginFormValues) => {
    setIsLoggingIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) throw error;
      
      const { data: { user: newUser } } = await supabase.auth.getUser();
      setUser(newUser);
      toast({ title: "Bem-vindo!", description: "Login realizado com sucesso." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast({ title: "Até logo!", description: "Log off realizado." });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f9f4]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f0f9f4] p-4">
        <Card className="w-full max-w-md shadow-2xl border-none">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Sprout className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Acesso ao Painel</CardTitle>
            <CardDescription>Faça login para gerenciar sua fazenda</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input {...loginForm.register("email")} placeholder="seu@email.com" />
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input {...loginForm.register("password")} type="password" placeholder="••••••••" />
              </div>
              <Button type="submit" className="w-full" disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentMonth = months[currentMonthIndex];
  const tips = agronomicTips[currentMonth];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-primary/10 p-2 rounded-xl">
          <Sprout className="h-6 w-6 text-primary" />
        </div>
        <span className="font-display font-bold text-xl text-secondary tracking-tight">WR Agro Tech</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        <Button 
          variant={activeTab === "overview" ? "secondary" : "ghost"} 
          className="w-full justify-start gap-3 text-base h-12"
          onClick={() => setActiveTab("overview")}
        >
          <LayoutDashboard className="h-5 w-5" />
          Visão Geral
        </Button>
        <Button 
          variant={activeTab === "calendar" ? "secondary" : "ghost"} 
          className="w-full justify-start gap-3 text-base h-12"
          onClick={() => setActiveTab("calendar")}
        >
          <Calendar className="h-5 w-5" />
          Agenda do Agricultor
        </Button>
      </nav>

      <div className="p-4 border-t border-border/50">
        <Button variant="ghost" className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
          Sair (Log Off)
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      <aside className="hidden lg:block w-64 bg-white border-r border-border h-screen sticky top-0 shadow-sm z-20">
        <SidebarContent />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-border sticky top-0 z-10 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-6 w-6 text-secondary" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <h1 className="text-xl font-bold text-secondary">
              {activeTab === "calendar" ? "Agenda do Agricultor" : "Painel de Controle"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {user.email?.[0].toUpperCase()}
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-red-600">
              <LogOut className="h-4 w-4 mr-1" />
              Sair
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-none shadow-md bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><CloudSun size={100} /></div>
                  <CardHeader className="pb-2"><CardTitle className="text-lg font-medium opacity-90">Clima</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-2 mb-2"><span className="text-4xl font-bold">24°C</span></div>
                    <div className="flex items-center gap-2 text-sm opacity-80"><MapPin size={14} /> São Paulo, BR</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "calendar" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="border-none shadow-xl bg-white overflow-hidden">
                  <CardHeader className="bg-primary/5 border-b border-primary/10 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary text-white p-3 rounded-xl shadow-lg shadow-primary/20">
                          <Calendar className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl text-secondary">Agenda Anual {new Date().getFullYear()}</CardTitle>
                          <CardDescription>Planejamento estratégico personalizado</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setCurrentMonthIndex((prev) => (prev === 0 ? 11 : prev - 1))}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="px-4 font-bold text-secondary min-w-[120px] text-center">
                          {currentMonth}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setCurrentMonthIndex((prev) => (prev === 11 ? 0 : prev + 1))}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[600px] p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-10">
                        {Array.from({ length: 31 }).map((_, i) => (
                          <Card key={i} className="border border-slate-100 hover:border-primary/30 transition-all bg-slate-50/30 group">
                            <CardContent className="p-3">
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-bold text-slate-400 group-hover:text-primary transition-colors">{i + 1}</span>
                                <CheckCircle2 className="h-3 w-3 text-slate-200 group-hover:text-primary/40" />
                              </div>
                              <p className="text-[10px] leading-tight text-slate-600 font-medium italic">
                                {getDailyTip(i, currentMonth)}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-bold text-secondary flex items-center gap-2 text-lg">
                          <Info className="h-5 w-5 text-primary" />
                          Principais Ações de {currentMonth}
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          {tips.map((tip, index) => (
                            <div key={index} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                              <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-primary/5 text-primary font-bold">
                                {index + 1}
                              </div>
                              <p className="text-secondary/80 font-semibold group-hover:text-secondary transition-colors">{tip}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
