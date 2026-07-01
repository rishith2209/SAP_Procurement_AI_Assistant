import React, { createContext, useContext, useState } from 'react';

export interface UserProfile {
  id?: string;
  name: string;
  role: string;
  department: string;
  email: string;
  approvalLimit: number;
  avatar?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const token = localStorage.getItem('sap_auth_token');
    return !!token && token !== 'true'; // Verify if token is a valid JWT string
  });
  
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('sap_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('http://localhost:5000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const json = await res.json();
      if (!res.ok || json.status === 'error') {
        alert(json.message || 'Authentication failed. Check credentials.');
        return false;
      }

      const { token, user: userProfile } = json.data;
      
      setIsAuthenticated(true);
      const profile = {
        id: userProfile.id,
        name: userProfile.name,
        role: userProfile.role,
        department: userProfile.department,
        email: userProfile.email,
        approvalLimit: userProfile.approvalLimit,
        avatar: userProfile.name.split(' ').map((n: string) => n[0]).join('')
      };

      setUser(profile);
      localStorage.setItem('sap_auth_token', token);
      localStorage.setItem('sap_user', JSON.stringify(profile));
      return true;
    } catch (err) {
      console.error('Login error:', err);
      alert('API server connection lost. Run container stacks.');
      return false;
    }
  };

  const logout = async () => {
    const token = localStorage.getItem('sap_auth_token');
    if (token) {
      try {
        await fetch('http://localhost:5000/api/v1/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (e) {
        console.error('Logout log write failed:', e);
      }
    }
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('sap_auth_token');
    localStorage.removeItem('sap_user');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
