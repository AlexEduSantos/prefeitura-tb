import { PainelHeader } from "@/components/painel-header";
import { UserManager } from "@/components/users-manager";

export default function UsersPage() {
  return (
    <section>
      <PainelHeader title="Usuários" />
      <div className="p-2">
        <UserManager />
      </div>
    </section>
  );
}
