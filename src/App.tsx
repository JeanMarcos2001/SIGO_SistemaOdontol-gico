import { PERMISOS, StoreProvider, paginaInicial, useStore } from './store'
import { Layout } from './components/Layout'
import { Toasts } from './components/ui'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Pacientes } from './pages/Pacientes'
import { Personal } from './pages/Personal'
import { Citas } from './pages/Citas'
import { Clinica } from './pages/Clinica'
import { Finanzas } from './pages/Finanzas'
import { Admin } from './pages/Admin'
import { Portal } from './pages/Portal'

function Contenido() {
  const { usuario, pagina } = useStore()
  if (!usuario) return <Login />
  // Control de permisos: si la página no pertenece al rol, se muestra la inicial
  const p = PERMISOS[usuario.rol].includes(pagina) ? pagina : paginaInicial(usuario.rol)
  return (
    <Layout>
      {p === 'dashboard' && <Dashboard />}
      {p === 'pacientes' && <Pacientes />}
      {p === 'personal' && <Personal />}
      {p === 'citas' && <Citas />}
      {p === 'clinica' && <Clinica />}
      {p === 'finanzas' && <Finanzas />}
      {p === 'admin' && <Admin />}
      {p === 'portal' && <Portal />}
    </Layout>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Contenido />
      <Toasts />
    </StoreProvider>
  )
}
