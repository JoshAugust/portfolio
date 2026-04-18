import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';

const OrchestraPage = lazy(() => import('./pages/Orchestra'));
const ProspectorPage = lazy(() => import('./pages/Prospector'));

const PageFallback = ({ label }: { label: string }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: '#0a0a0f', color: '#e8e8f0',
    fontFamily: 'monospace', fontSize: '14px'
  }}>
    {label}
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route
          path="/orchestra"
          element={
            <Suspense fallback={<PageFallback label="Loading Orchestra…" />}>
              <OrchestraPage />
            </Suspense>
          }
        />
        <Route
          path="/prospector"
          element={
            <Suspense fallback={<PageFallback label="Loading Prospector…" />}>
              <ProspectorPage />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
