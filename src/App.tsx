import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import DashboardPage from "@/pages/DashboardPage";
import PlansPage from "@/pages/PlansPage";
import CalendarPage from "@/pages/CalendarPage";
import NotificationsPage from "@/pages/NotificationsPage";

function AppLayout() {
  return (
    <div className="min-h-screen bg-slatex-900 text-slate-100 font-sans">
      <Header />
      <Sidebar />
      <main className="md:ml-56 ml-14 mt-14 p-4 md:p-6 min-h-[calc(100vh-3.5rem)] animate-fade-in-up">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/plans" element={<PlansPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}
