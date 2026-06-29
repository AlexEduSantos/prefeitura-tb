import { PartialType } from '@nestjs/mapped-types';
import { CreateBannerImageDto } from './create-banner-image.dto';

export class UpdateBannerImageDto extends PartialType(CreateBannerImageDto) {}
