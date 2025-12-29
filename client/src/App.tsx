import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import MyAnalyses from "@/pages/MyAnalyses";
import LoginGenerator from "@/pages/LoginGenerator";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/signup">
        <Redirect to="/" />
      </Route>
      <Route path="/setup">
        <Redirect to="/" />
      </Route>
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/my-analyses" component={MyAnalyses} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/login-generator" component={LoginGenerator} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
