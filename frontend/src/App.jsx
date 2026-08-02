import { NavLink, Route, Routes } from 'react-router'

import HomePage from './pages/HomePage.jsx'
import DeviceFormPage from './pages/DeviceFormPage.jsx'
import DeviceAssetManagementPage from './pages/DeviceAssetManagementPage.jsx'
import AssetFormPage from './pages/AssetFormPage.jsx'
import DeviceSummaryPage from './pages/DeviceSummaryPage.jsx'
import SessionRunnerPage from './pages/SessionRunnerPage.jsx'
import ModifySessionPage from './pages/ModifySessionPage.jsx'
import ResultsPage from './pages/ResultsPage.jsx'

// Le otto pagine previste dalla Specifica Tecnica. La barra le espone tutte
// perche la bozza va guardata pagina per pagina, non percorsa come un flusso:
// non e la navigazione del prodotto, che avra invece le route guard descritte
// dalla Specifica Tecnica (niente valutazione senza un dispositivo attivo).
const pagine = [
  { percorso: '/', nome: 'Home' },
  { percorso: '/dispositivo/nuovo', nome: 'Dati dispositivo' },
  { percorso: '/dispositivo/asset', nome: 'Asset' },
  { percorso: '/asset/nuovo', nome: 'Nuovo asset' },
  { percorso: '/dispositivo/riepilogo', nome: 'Riepilogo' },
  { percorso: '/sessione', nome: 'Valutazione' },
  { percorso: '/sessione/modifica', nome: 'Modifica sessione' },
  { percorso: '/risultati', nome: 'Risultati' },
]

export default function App() {
  return (
    <>
      <header className="intestazione">
        <div className="intestazione-corpo">
          <span className="marchio">EN 18031 — Verifica di conformità</span>
          <span className="badge-bozza">bozza non funzionale</span>
        </div>
        <nav className="mappa">
          <span className="mappa-etichetta">Pagine della bozza</span>
          {pagine.map(pagina => (
            <NavLink
              key={pagina.percorso}
              to={pagina.percorso}
              end
              className={({ isActive }) => (isActive ? 'attiva' : undefined)}
            >
              {pagina.nome}
            </NavLink>
          ))}
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dispositivo/nuovo" element={<DeviceFormPage />} />
          <Route path="/dispositivo/asset" element={<DeviceAssetManagementPage />} />
          <Route path="/asset/nuovo" element={<AssetFormPage />} />
          <Route path="/dispositivo/riepilogo" element={<DeviceSummaryPage />} />
          <Route path="/sessione" element={<SessionRunnerPage />} />
          <Route path="/sessione/modifica" element={<ModifySessionPage />} />
          <Route path="/risultati" element={<ResultsPage />} />
        </Routes>
      </main>
    </>
  )
}
