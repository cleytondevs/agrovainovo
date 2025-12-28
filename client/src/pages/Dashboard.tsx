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
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Info,
  Menu,
  MapPin,
  TrendingUp,
  CheckCircle2,
  Leaf,
  Moon,
  Sun,
  ArrowUp,
  ArrowDown,
  Circle,
  Beaker
} from "lucide-react";
import SoilAnalysis from "./SoilAnalysis";
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

// Tipos de Manejo
const MANEJO = {
  FOLHAS: { label: "Folhas", icon: Leaf, color: "text-green-600" },
  RAIZES: { label: "Raízes", icon: Sprout, color: "text-orange-600" },
  FRUTOS: { label: "Frutos", icon: Circle, color: "text-red-600" },
  FLORES: { label: "Flores", icon: Sun, color: "text-yellow-600" },
};

// Fases da Lua
const LUNAR_PHASES = {
  MINGUANTE: { label: "Minguante", icon: Moon, style: "rotate-180" },
  NOVA: { label: "Nova", icon: Circle, style: "fill-current" },
  CRESCENTE: { label: "Crescente", icon: Moon, style: "" },
  CHEIA: { label: "Cheia", icon: Circle, style: "" },
};

const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState("calendar");
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0); // Start from January 2026
  const CALENDAR_YEAR = 2026;

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
  
  // Helper function to get calendar days
  const getCalendarDays = (monthIndex: number, year: number) => {
    const firstDay = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };
  
  const calendarDays = getCalendarDays(currentMonthIndex, CALENDAR_YEAR);

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
          data-testid="button-tab-overview"
        >
          <LayoutDashboard className="h-5 w-5" />
          Visão Geral
        </Button>
        <Button 
          variant={activeTab === "calendar" ? "secondary" : "ghost"} 
          className="w-full justify-start gap-3 text-base h-12"
          onClick={() => setActiveTab("calendar")}
          data-testid="button-tab-calendar"
        >
          <CalendarIcon className="h-5 w-5" />
          Agenda do Agricultor
        </Button>
        <Button 
          variant={activeTab === "soil" ? "secondary" : "ghost"} 
          className="w-full justify-start gap-3 text-base h-12"
          onClick={() => setActiveTab("soil")}
          data-testid="button-tab-soil"
        >
          <Beaker className="h-5 w-5" />
          Análise de Solo
        </Button>
      </nav>

      <div className="p-4 border-t border-border/50">
        <Button variant="ghost" className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
          Sair
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
              {activeTab === "calendar" ? "Agenda do Agricultor" : activeTab === "soil" ? "Análise de Solo" : "Painel de Controle"}
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
          <div className="max-w-7xl mx-auto space-y-8">
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

            {activeTab === "soil" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <SoilAnalysis userEmail={user?.email} />
              </div>
            )}

            {activeTab === "calendar" && (
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Calendário Principal */}
                <Card className="xl:col-span-3 border-none shadow-xl bg-white overflow-hidden">
                  <CardHeader className="bg-[#7aa874] text-white p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                          <CalendarIcon className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl font-bold uppercase tracking-widest">{currentMonth} {CALENDAR_YEAR}</CardTitle>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-white/10 p-1 rounded-lg backdrop-blur-sm">
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setCurrentMonthIndex((p) => (p === 0 ? 11 : p - 1))}><ChevronLeft /></Button>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setCurrentMonthIndex((p) => (p === 11 ? 0 : p + 1))}><ChevronRight /></Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="grid grid-cols-7 text-center bg-[#7aa874]/90 text-white font-bold text-xs py-2 uppercase tracking-tighter">
                      <div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div>
                    </div>
                    <div className="grid grid-cols-7 gap-px bg-slate-200">
                      {calendarDays.map((day, i) => {
                        if (day === null) return <div key={i} className="bg-slate-50 min-h-[100px]"></div>;
                        
                        // Lógica visual simulada baseada na imagem
                        const isLunarMovement = (day >= 12 && day <= 25);
                        const lunarPhase = day === 6 ? "MINGUANTE" : day === 13 ? "NOVA" : day === 20 ? "CRESCENTE" : day === 28 ? "CHEIA" : null;
                        
                        return (
                          <div key={i} className={`bg-white min-h-[100px] p-2 flex flex-col justify-between relative group ${isLunarMovement ? 'bg-orange-50/50' : ''}`}>
                            {isLunarMovement && <div className="absolute inset-x-0 top-0 h-1 bg-orange-400"></div>}
                            <div className="flex justify-between items-start">
                              <span className={`text-lg font-black ${day === 1 || day === 11 ? 'text-green-600' : 'text-slate-700'}`}>{day.toString().padStart(2, '0')}</span>
                              {lunarPhase && (
                                <div className="flex flex-col items-center">
                                  {lunarPhase === "MINGUANTE" && <Moon className="h-4 w-4 text-slate-400 rotate-180" />}
                                  {lunarPhase === "NOVA" && <Circle className="h-4 w-4 text-green-500 fill-current" />}
                                  {lunarPhase === "CRESCENTE" && <Moon className="h-4 w-4 text-slate-400" />}
                                  {lunarPhase === "CHEIA" && <Circle className="h-4 w-4 text-slate-300" />}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1 mt-auto">
                               {day % 3 === 0 && <Leaf className="h-4 w-4 text-green-600" />}
                               {day % 5 === 0 && <Sprout className="h-4 w-4 text-orange-600" />}
                               {day % 7 === 0 && <Circle className="h-4 w-4 text-red-600" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Legenda Lateral */}
                <div className="space-y-6">
                  <Card className="border-none shadow-lg bg-[#fdf6ec]">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-black text-[#b45309] uppercase">Movimento Lunar</CardTitle></CardHeader>
                    <CardContent className="space-y-4 text-xs">
                      <div className="flex gap-3">
                        <div className="bg-slate-300 p-1 rounded-sm h-fit"><Moon className="h-4 w-4 text-white rotate-180" /></div>
                        <div><p className="font-bold text-slate-700">Ascendente</p><p className="text-slate-500">Colheita de frutos, flores e ervas medicinais.</p></div>
                      </div>
                      <div className="flex gap-3">
                        <div className="bg-orange-400 p-1 rounded-sm h-fit"><Moon className="h-4 w-4 text-white" /></div>
                        <div><p className="font-bold text-slate-700">Descendente</p><p className="text-slate-500">Semeaduras, transplante e podas.</p></div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-lg bg-white">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-black text-green-700 uppercase">Manejo Ideal</CardTitle></CardHeader>
                    <CardContent className="space-y-3 text-xs">
                      <div className="flex items-center gap-2 font-bold"><Leaf className="h-4 w-4 text-green-600" /> Folhas</div>
                      <div className="flex items-center gap-2 font-bold"><Sprout className="h-4 w-4 text-orange-600" /> Raízes</div>
                      <div className="flex items-center gap-2 font-bold"><Circle className="h-4 w-4 text-red-600" /> Frutos</div>
                      <div className="flex items-center gap-2 font-bold"><Sun className="h-4 w-4 text-yellow-600" /> Flores</div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-lg bg-white">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-black text-slate-700 uppercase">Datas Importantes</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      <div className="flex gap-2"><Badge className="bg-green-600">01</Badge> <span>Feriado Internacional</span></div>
                      <div className="flex gap-2"><Badge className="bg-green-600">11</Badge> <span>Dia do Combate à Poluição</span></div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
