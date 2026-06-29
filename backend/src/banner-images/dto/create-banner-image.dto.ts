import { IsString, IsOptional, IsInt, IsUUID } from 'class-validator';

export class CreateBannerImageDto {
  @IsUUID()
  bannerId: string;

  @IsUUID()
  mediaId: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsString()
  link?: string;
}
