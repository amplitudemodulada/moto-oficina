import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Clientes } from './pages/Clientes'
import { OrdemServico } from './pages/OrdemServico'
import { Estoque } from './pages/Estoque'
import { Checkout } from './pages/Checkout'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/"         element={<Dashboard />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/ordens"   element={<OrdemServico />} />
            <Route path="/estoque"  element={<Estoque />} />
            <Route path="/checkout" element={<Checkout />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
