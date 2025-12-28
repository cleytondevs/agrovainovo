import { supabase } from "@/lib/supabaseClient";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LogOut, 
  LayoutDashboard, 
  Sprout, 
  CloudSun, 
  Droplets, 
  TrendingUp,
  MapPin,
  Wind,
  Bell,
  Menu,
  ChevronRight
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLocation("/");
      } else {
        setUserEmail(user.email ?? null);
        setLoading(false);
      }
    };
    checkUser();
  }, [setLocation]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLocation("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f9f4]">
        <div className="flex flex-col items-center gap-4">
          <Sprout className="h-12 w-12 text-primary animate-pulse" />
          <p className="text-secondary font-medium">Carregando seus dados...</p>
        </div>
      </div>
    );
  }

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
          variant={activeTab === "crops" ? "secondary" : "ghost"} 
          className="w-full justify-start gap-3 text-base h-12"
          onClick={() => setActiveTab("crops")}
        >
          <Sprout className="h-5 w-5" />
          Minhas Safras
        </Button>
        <Button 
          variant={activeTab === "analytics" ? "secondary" : "ghost"} 
          className="w-full justify-start gap-3 text-base h-12"
          onClick={() => setActiveTab("analytics")}
        >
          <TrendingUp className="h-5 w-5" />
          Análises
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
            
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-secondary">Painel de Controle</h1>
              <p className="text-sm text-muted-foreground">Bem-vindo, {userEmail?.split('@')[0]}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="rounded-full bg-slate-50 border-slate-200">
              <Bell className="h-5 w-5 text-secondary" />
            </Button>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border-2 border-white shadow-sm">
              {userEmail?.[0].toUpperCase()}
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-red-600">
              <LogOut className="h-4 w-4 mr-1" />
              Sair
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-none shadow-md bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <CloudSun size={100} />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium opacity-90">Clima</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-bold">24°C</span>
                    <span className="text-sm opacity-80 mb-1">Parcialmente Nublado</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm opacity-80">
                    <MapPin size={14} /> São Paulo, BR
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Umidade</CardTitle>
                  <Droplets className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">68%</div>
                  <p className="text-xs text-muted-foreground mt-1">+2% desde ontem</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Umidade do Solo</CardTitle>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">Ideal</div>
                  <p className="text-xs text-muted-foreground mt-1">Verificado há 5m</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Vento</CardTitle>
                  <Wind className="h-4 w-4 text-slate-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">12 km/h</div>
                  <p className="text-xs text-muted-foreground mt-1">Direção: NE</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-secondary">Visão do Campo</h2>
                  <Button variant="outline" className="text-primary border-primary/20 hover:bg-primary/5">Ver Mapa</Button>
                </div>

                <div className="grid gap-4">
                  {[1, 2].map((field) => (
                    <Card key={field} className="group hover:border-primary/50 transition-all duration-300">
                      <CardContent className="p-0">
                        <div className="flex flex-col sm:flex-row">
                          <div className="sm:w-48 h-32 sm:h-auto bg-slate-100 relative overflow-hidden rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none">
                            <img 
                              src={`https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop&q=80&random=${field}`} 
                              alt="Campo" 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-secondary">
                              Campo A-{field}
                            </div>
                          </div>
                          <div className="p-5 flex-1 flex flex-col justify-center">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-bold text-lg text-secondary group-hover:text-primary transition-colors">Plantação de Soja</h3>
                                <p className="text-sm text-muted-foreground">Plantado: 15 Out, 2023 • 45 Hectares</p>
                              </div>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Saudável
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 mt-2 mb-4 overflow-hidden">
                              <div className="bg-primary h-2 rounded-full" style={{ width: `${65 + field * 5}%` }}></div>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">Estágio: Floração</span>
                              <Button variant="link" className="p-0 h-auto text-primary font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                                Detalhes <ChevronRight size={14} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-secondary">Ações Necessárias</h2>
                
                <Card className="border-l-4 border-l-yellow-500 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="bg-yellow-100 p-2 rounded-lg h-fit">
                        <Droplets className="h-5 w-5 text-yellow-700" />
                      </div>
                      <div>
                        <h4 className="font-bold text-secondary text-sm">Irrigação Necessária</h4>
                        <p className="text-xs text-muted-foreground mt-1">Níveis de umidade no Campo B-2 abaixo de 30%.</p>
                        <Button size="sm" className="mt-3 w-full bg-yellow-500 hover:bg-yellow-600 text-white border-none shadow-none">Agendar</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-primary">Próxima Colheita</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="text-center bg-white p-2 rounded-lg border border-primary/10 shadow-sm min-w-[60px]">
                        <span className="block text-xs font-bold text-primary uppercase">Nov</span>
                        <span className="block text-2xl font-bold text-secondary">15</span>
                      </div>
                      <div>
                        <p className="font-medium text-secondary">Milho Campo C-1</p>
                        <p className="text-xs text-muted-foreground">Estimado: 12 Toneladas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
