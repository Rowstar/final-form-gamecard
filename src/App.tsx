/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.tsx";
import Create from "./pages/Create.tsx";
import CardReveal from "./pages/CardReveal.tsx";
import Profile from "./pages/Profile.tsx";
import Auth from "./pages/Auth.tsx";
import ForgeLab from "./pages/ForgeLab.tsx";
import Navbar from "./components/Navbar.tsx";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-emerald-500/30">
        <Navbar />
        <main className="max-w-md mx-auto px-4 py-8 pb-24 sm:max-w-xl md:max-w-2xl lg:max-w-4xl">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<Create />} />
            <Route path="/card/:id" element={<CardReveal />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forge-lab" element={<ForgeLab />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

