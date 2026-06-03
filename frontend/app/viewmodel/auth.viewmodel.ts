import { useState } from "react";
import { AuthService } from "@/app/service/auth.service";
import { IUser } from "@/app/type/user";
import { useRouter } from "next/navigation";

export function useAuthViewModel() {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const loggedUser = await AuthService.login(email, password);
      setUser(loggedUser);
      router.push("/administrator");
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const newUser = await AuthService.register(name, email, password);
      setUser(newUser);
      router.push("/painel"); // Redireciona para o painel após o registro
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao registrar");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      await AuthService.logout();
      setUser(null);
      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao sair");
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
  };
}
