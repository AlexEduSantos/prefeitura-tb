import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserService } from "@/service/user.service";
import { IUser } from "@/type/user";

export function useUserViewModel() {
  const queryClient = useQueryClient();

  // Buscar todos os usuários
  const usersQuery = useQuery({
    queryKey: ["user"],
    queryFn: () => UserService.getUsers(),
  });

  return {
    user: usersQuery.data,
    isLoadingUser: usersQuery.isLoading,
    isErrorUser: usersQuery.isError,
    errorUser: usersQuery.error,
  };
}
