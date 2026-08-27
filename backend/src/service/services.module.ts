import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CaslModule } from '../casl/casl.module';
import { ServicesService } from './services.service';
import { ServiceController } from './services.controller';

@Module({
  imports: [PrismaModule, CaslModule],
  controllers: [ServiceController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
