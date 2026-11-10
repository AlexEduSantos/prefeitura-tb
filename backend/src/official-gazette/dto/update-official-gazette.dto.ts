import { PartialType } from '@nestjs/swagger';
import { CreateOfficialGazetteDto } from './create-official-gazette.dto';

export class UpdateOfficialGazetteDto extends PartialType(
  CreateOfficialGazetteDto,
) {}

