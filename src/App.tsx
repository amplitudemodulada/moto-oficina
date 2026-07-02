import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Clientes } from './pages/Clientes'
import { OrdemServico } from './pages/OrdemServico'
import { Estoque } from './pages/Estoque'
import { Checkout } from './pages/Checkout'
import { Financeiro } from './pages/Financeiro'
import { Backup } from './pages/Backup'
import { Welcome } from './pages/Welcome'
import { Ajuda } from './pages/Ajuda'
import { VendaRapida } from './pages/VendaRapida'
import { Wrench } from 'lucide-react'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center animate-pulse">
          <Wrench size={24} className="text-white" />
        </div>
        <p className="text-gray-500 text-sm">Carregando...</p>
      </div>
    </div>
  )
}

function AppRoutes() {
  const { session, loading, isAdmin } = useAuth()

  if (loading)   return <LoadingScreen />
  if (!session)  return <Login />

  return (
    <Routes>
      {/* Tela de boas-vindas — sem sidebar */}
      <Route path="/welcome" element={<Welcome />} />

      <Route element={<Layout />}>
        <Route path="/"           element={<Dashboard />} />
        <Route path="/clientes"   element={<Clientes />} />
        <Route path="/ordens"     element={<OrdemServico />} />
        <Route path="/estoque"    element={<Estoque />} />
        <Route path="/checkout"     element={<Checkout />} />
        <Route path="/venda-rapida" element={<VendaRapida />} />
        <Route path="/financeiro"   element={<Financeiro />} />
        <Route path="/backup" element={<Backup />} />
        <Route path="/ajuda"  element={<Ajuda />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppProvider>
            <AppRoutes />
          </AppProvider>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
