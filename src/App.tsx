import { BrowserRouter, Route, Routes } from "react-router-dom";
import BottomNavigation from "./components/Navigation/BottomNavigation";
import { AppProvider } from "./context/AppContext";
import Dashboard from "./pages/Dashboard";
import Planner from "./pages/Planner";
import Salary from "./pages/Salary";
import Compliance from "./pages/Compliance";
import Profile from "./pages/Profile";
import Calendar from "./pages/Calendar";
import "./App.css";

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <main className="app-shell">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/plan" element={<Planner />} />
            <Route path="/gehalt" element={<Salary />} />
            <Route path="/pruefung" element={<Compliance />} />
            <Route path="/profil" element={<Profile />} />
            <Route path="/kalender" element={<Calendar />} />
          </Routes>
        </main>

        <BottomNavigation />
      </BrowserRouter>
    </AppProvider>
  );
}