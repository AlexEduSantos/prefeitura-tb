import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateBannerDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsUUID()
  entityId: string;
}
