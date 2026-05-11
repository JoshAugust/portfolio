import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CRM from './components/CRM';
import Galaxy from './components/Galaxy';
import AgentOverlay from './components/AgentOverlay';
import Onboarding from './components/Onboarding';

import Login from './components/Login';

const MainContent = () => {
  const { currentUser, user, isLoadingData } = useApp();
  const [currentView, setCurrentView] = useState('dashboard');

  if (!currentUser) {
    return <Login />;
  }

  // Show loading while fetching user data from Firestore
  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-white">
        <div className="relative w-32 h-32">
          <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-cyan-400 animate-pulse font-mono text-sm">LOADING YOUR DATA...</p>
      </div>
    );
  }

  if (!user) {
    return <Onboarding />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'crm': return <CRM />;
      case 'galaxy': return <Galaxy />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout currentView={currentView} setCurrentView={setCurrentView}>
      {renderView()}
      <AgentOverlay />
    </Layout>
  );
};

const App = () => {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
};

export default App;
