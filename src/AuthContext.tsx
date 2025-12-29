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
    // Atenção: A rota de login no seu backend é /auth/login (fora do /api)
    const response = await axios.post('http://localhost:8080/auth/login', {
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