import { PrismaClient } from '../../generated/prisma/client';

/**
 * Retorna todos os IDs da organização especificada e de todas as suas organizações descendentes (filhas, netas, etc).
 * Permite que um gestor de uma secretaria consiga gerenciar os departamentos e divisões subordinados.
 */
export async function getAllDescendantOrgIds(
  prisma: PrismaClient,
  rootOrgId: string,
): Promise<string[]> {
  if (!rootOrgId) return [];

  const result = await prisma.$queryRaw<{ id: string }[]>`
    WITH RECURSIVE org_tree AS (
      SELECT id FROM "organization" WHERE id = ${rootOrgId}::uuid
      UNION ALL
      SELECT o.id FROM "organization" o
      INNER JOIN org_tree ot ON o."parentId" = ot.id
    )
    SELECT id FROM org_tree;
  `;

  return result.map((r) => r.id);
}
