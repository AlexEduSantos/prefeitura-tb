import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('🚀 Iniciando script de migração e backfill de dados...');

  try {
    const entities = await prisma.entity.findMany();
    console.log(`📦 Encontradas ${entities.length} entidades legadas.`);

    for (const entity of entities) {
      console.log(`\nProcessando Entity: "${entity.title}" (slug: ${entity.slug}, id: ${entity.id})...`);

      // 1. Criar ou obter Space correspondente
      const space = await prisma.space.upsert({
        where: { slug: entity.slug },
        update: { title: entity.title },
        create: {
          slug: entity.slug,
          title: entity.title,
          description: `Espaço criado automaticamente a partir de Entity: ${entity.title}`,
        },
      });

      // 2. Criar ou obter Organization correspondente
      let organization = await prisma.organization.findFirst({
        where: { name: entity.title },
      });

      if (!organization) {
        organization = await prisma.organization.create({
          data: {
            name: entity.title,
            type: 'secretaria',
            active: true,
            defaultSpaceId: space.id,
          },
        });
      } else if (!organization.defaultSpaceId) {
        organization = await prisma.organization.update({
          where: { id: organization.id },
          data: { defaultSpaceId: space.id },
        });
      }

      // 3. Criar ou obter Categoria editorial padrão para essa secretaria/área
      const category = await prisma.category.upsert({
        where: { slug: entity.slug },
        update: { name: entity.title },
        create: {
          slug: entity.slug,
          name: entity.title,
          description: `Categoria editorial para ${entity.title}`,
        },
      });

      console.log(`  -> Space ID: ${space.id}`);
      console.log(`  -> Organization ID: ${organization.id}`);
      console.log(`  -> Category ID: ${category.id}`);

      // 4. Backfill de Users
      const usersUpdated = await prisma.user.updateMany({
        where: { entityId: entity.id, organizationId: null },
        data: { organizationId: organization.id },
      });
      console.log(`  -> Usuários atualizados: ${usersUpdated.count}`);

      // 5. Backfill de Pages
      const pagesUpdated = await prisma.page.updateMany({
        where: { entityId: entity.id, organizationId: null },
        data: {
          organizationId: organization.id,
          spaceId: space.id,
        },
      });
      console.log(`  -> Páginas atualizadas: ${pagesUpdated.count}`);

      // 6. Backfill de Articles
      const articles = await prisma.article.findMany({
        where: { entityId: entity.id },
        select: { id: true, organizationId: true },
      });

      let articlesUpdatedCount = 0;
      for (const article of articles) {
        await prisma.article.update({
          where: { id: article.id },
          data: {
            organizationId: organization.id,
            categories: {
              connect: [{ id: category.id }],
            },
          },
        });
        articlesUpdatedCount++;
      }
      console.log(`  -> Artigos atualizados: ${articlesUpdatedCount}`);

      // 7. Backfill de Galleries
      const galleriesUpdated = await prisma.galleries.updateMany({
        where: { entityId: entity.id, organizationId: null },
        data: { organizationId: organization.id },
      });
      console.log(`  -> Galerias atualizadas: ${galleriesUpdated.count}`);

      // 8. Backfill de Popups
      const popupsUpdated = await prisma.popups.updateMany({
        where: { entityId: entity.id, organizationId: null },
        data: { organizationId: organization.id },
      });
      console.log(`  -> Popups atualizados: ${popupsUpdated.count}`);

      // 9. Backfill de Services
      const servicesUpdated = await prisma.services.updateMany({
        where: { entityId: entity.id, organizationId: null },
        data: { organizationId: organization.id },
      });
      console.log(`  -> Serviços atualizados: ${servicesUpdated.count}`);
    }

    console.log('\n✅ Backfill de dados concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a migração de dados:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
