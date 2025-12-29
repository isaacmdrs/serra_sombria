import { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import axios from 'axios';

interface AuthContextData {
  signed: boolean;
  user: string | null;
  signIn: (login: string, pass: string) => Promise<void>;
  signOut: () => void;
  loadingAuth: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const storagedToken = localStorage.getItem('serra_token');
    const storagedUser = localStorage.getItem('serra_user');

    if (storagedToken && storagedUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(storagedUser);
    }
    setLoadingAuth(false);
  }, []);

  async function signIn(login: string, pass: string) {
      // 1. Pega a URL do Vercel (Railway) ou usa localhost se estiver no seu PC
      // Se a variável vier como ".../api", removemos o final para pegar a raiz
      const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const baseUrl = envUrl.replace('/api', ''); 

      // 2. Agora monta a URL correta: https://...railway.app/auth/login
      const response = await axios.post(`${baseUrl}/auth/login`, {
        login,
        senha: pass
      });

      const { token } = response.data;

      localStorage.setItem('serra_token', token);
      localStorage.setItem('serra_user', login);
      setUser(login);
    }

  function signOut() {
    localStorage.clear();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ signed: !!user, user, signIn, signOut, loadingAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}