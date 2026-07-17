import { PartialType } from '@nestjs/mapped-types';
import { CreateGalleriesDto } from './create-galleries.dto';

export class UpdateGalleriesDto extends PartialType(CreateGalleriesDto) {}
