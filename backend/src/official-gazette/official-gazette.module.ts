import { Module } from '@nestjs/common';
import { OfficialGazetteService } from './official-gazette.service';
import { OfficialGazetteController } from './official-gazette.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CaslModule } from '../casl/casl.module';

@Module({
  imports: [PrismaModule, CaslModule],
  controllers: [OfficialGazetteController],
  providers: [OfficialGazetteService],
  exports: [OfficialGazetteService],
})
export class OfficialGazetteModule {}

