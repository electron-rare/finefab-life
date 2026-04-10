import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { userManager, login, logout, type User } from "../lib/auth";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login,
  logout,
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        if (window.location.search.includes("code=") || window.location.search.includes("state=")) {
          const callbackUser = await userManager.signinRedirectCallback();
          setUser(callbackUser);
          window.history.replaceState({}, "", window.location.pathname);
        } else {
          const existingUser = await userManager.getUser();
          setUser(existingUser?.expired ? null : existingUser);
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    init();

    const onLoaded = (u: User) => setUser(u);
    const onUnloaded = () => setUser(null);
    userManager.events.addUserLoaded(onLoaded);
    userManager.events.addUserUnloaded(onUnloaded);
    return () => {
      userManager.events.removeUserLoaded(onLoaded);
      userManager.events.removeUserUnloaded(onUnloaded);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user && !user.expired, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
