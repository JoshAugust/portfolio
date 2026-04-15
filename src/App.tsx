import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import OrchestraPage from './pages/Orchestra';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/orchestra" element={<OrchestraPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
