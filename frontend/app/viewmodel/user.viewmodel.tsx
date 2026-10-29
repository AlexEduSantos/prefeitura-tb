import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProfileService } from "@/app/service/profile.service";
import { UserService } from "../service/user.service";
import { IUser } from "../type/user";
import {
  ColumnDef,
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import Image from "next/image";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  PencilIcon,
  TrashIcon,
} from "lucide-react";
import { format } from "date-fns";
import { IOrganization } from "../type/organization";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function useProfileViewModel() {
  // Buscar todos os usuários
  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: () => ProfileService.getProfiles(),
  });

  return {
    profile: profileQuery.data,
    isLoadingProfile: profileQuery.isLoading,
    isErrorProfile: profileQuery.isError,
    errorProfile: profileQuery.error,
  };
}

export function useUser() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    username: true,
    name: true,
    email: true,
    avatar: true,
    phone: true,
    active: true,
    organization: true,
    createdAt: true,
    updatedAt: true,
  });
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");

  const {
    data: users,
    isLoading: isUserLoading,
    isError: isUserError,
    error: userError,
  } = useQuery({
    queryKey: ["users"],
    queryFn: () => UserService.getUsers(),
  });

  const queryClient = useQueryClient();

  const { mutateAsync: createUser } = useMutation({
    mutationFn: (data: Partial<IUser>) => UserService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const { mutateAsync: updateUser } = useMutation({
    mutationFn: (data: Partial<IUser>) =>
      UserService.updateUser(data.id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const { mutateAsync: deleteUser } = useMutation({
    mutationFn: (id: string) => UserService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "update">("create");
  const [initialData, setInitialData] = useState<IUser | null>(null);

  // Handlers
  const handleOpenModal = (user?: IUser) => {
    setOpenModal(true);
    if (user) {
      setModalMode("update");
      setInitialData(user);
    } else {
      setModalMode("create");
      setInitialData(null);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setModalMode("create");
    setInitialData(null);
  };

  const handleSubmit = (data: IUser) => {
    if (modalMode === "create") {
      createUser(data);
    } else {
      updateUser(data);
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    return (
      <AlertDialog>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Tem certeza que deseja excluir este usuário?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteUser(id)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  // Columns and Tables

  const columns: ColumnDef<IUser>[] = [
    {
      accessorKey: "active",
      header: "Status",
      cell: (info) => {
        const active = info.getValue() as boolean;
        return active ? (
          <Badge
            variant="default"
            className="bg-green-500 aspect-square hover:bg-green-600"
          />
        ) : (
          <Badge
            variant="default"
            className="bg-red-500 aspect-square hover:bg-red-600"
          />
        );
      },
    },
    {
      accessorKey: "avatar",
      header: "Avatar",
      cell: ({ row }) => {
        const avatar = row.getValue("avatar") as string | undefined;
        const name = row.getValue("name")?.toString().charAt(0);
        return (
          <Avatar>
            <AvatarImage src={avatar} />
            <AvatarFallback>{name}</AvatarFallback>
          </Avatar>
        );
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-0 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nome
          {column.getIsSorted() && column.getIsSorted() === "asc" ? (
            <ArrowDownIcon className="h-4 w-4" />
          ) : (
            <ArrowUpIcon className="h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
<<<<<<< HEAD
        return <span className="text-sm">{name}</span>;
=======
        return <span className="text-sm text-muted-foreground">{name}</span>;
>>>>>>> d3cbb8f519955fb6bf6c66e8b751cb9440c57fdc
      },
    },
    {
      accessorKey: "username",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-0 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nome de Usuário
          {column.getIsSorted() && column.getIsSorted() === "asc" ? (
            <ArrowDownIcon className="h-4 w-4" />
          ) : (
            <ArrowUpIcon className="h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const username = row.getValue("username") as string;
        return (
          <span className="text-sm text-muted-foreground">{username}</span>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => {
        const email = row.getValue("email") as string;
        return <span className="text-sm text-muted-foreground">{email}</span>;
      },
    },
    {
      accessorKey: "organization",
      header: "Organização",
      cell: ({ row }) => {
        const organization = row.getValue("organization") as IOrganization;
        return (
          <span className="text-sm text-muted-foreground">
            {organization?.title ?? "Administração Geral"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0 hover:bg-primary/20 border-none bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenModal(user);
              }}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="h-8 w-8 p-0 border-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(user.id);
                  }}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Tem certeza que deseja excluir o usuário{" "}
                    <span className="italic text-primary">{user.name}</span> ?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteUser(user.id)}>
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      },
    },
  ];

  const table = useReactTable<IUser>({
    data: users ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getRowId: (row) => row.id,
    onRowSelectionChange: setRowSelection,
    enableMultiRowSelection: false,
    initialState: {
      sorting: [
        {
          id: "name",
          desc: true,
        },
      ],
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return {
    users,
    isUserLoading,
    isUserError,
    userError,
    createUser,
    updateUser,
    deleteUser,

    // table state
    columns,
    table,
    rowSelection,
    columnFilters,
    columnVisibility,
    sorting,
    setColumnFilters,
    setColumnVisibility,
    setSorting,
    setRowSelection,
    globalFilter,
    setGlobalFilter,

    // modal state
    openModal,
    setOpenModal,
    modalMode,
    setModalMode,
    initialData,
    setInitialData,
    handleOpenModal,
    handleCloseModal,
    handleSubmit,
    handleDelete,
  };
}
