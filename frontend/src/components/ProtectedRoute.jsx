import LoginPage from './LoginPage.jsx';

export default function ProtectedRoute({ auth, children }) {
  if (!auth.isAuthenticated) {
    return <LoginPage onLogin={auth.login} onRegister={auth.register} />;
  }
  return children;
}
