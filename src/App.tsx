import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';

const OrchestraPage = lazy(() => import('./pages/Orchestra'));

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route
          path="/orchestra"
          element={
            <Suspense fallback={
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100vh', background: '#0a0a0f', color: '#e8e8f0',
                fontFamily: 'monospace', fontSize: '14px'
              }}>
                Loading Orchestra…
              </div>
            }>
              <OrchestraPage />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
