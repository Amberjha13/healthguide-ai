import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { useAuth } from './hooks/useAuth.js';

function Root() {
  const auth = useAuth();
  return (
    <ProtectedRoute auth={auth}>
      <App auth={auth} />
    </ProtectedRoute>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
