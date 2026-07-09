import { IsString, IsOptional, IsBoolean, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateBannerImageDto } from '../../banner-images/dto/create-banner-image.dto';

export class CreateBannerDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsUUID()
  entityId: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateBannerImageDto)
  slides?: CreateBannerImageDto[];
}
