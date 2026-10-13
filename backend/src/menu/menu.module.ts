import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CaslModule } from '../casl/casl.module';
import { MenusController } from './menu.controller';
import { MenusService } from './menu.service';

@Module({
  imports: [PrismaModule, CaslModule],
  controllers: [MenusController],
  providers: [MenusService],
  exports: [MenusService],
})
export class MenuModule {}
