import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CaslModule } from '../casl/casl.module';
import { PopupsController } from './popups.controller';
import { PopupsService } from './popups.service';

@Module({
  imports: [PrismaModule, CaslModule],
  controllers: [PopupsController],
  providers: [PopupsService],
  exports: [PopupsService],
})
export class PopupsModule {}
