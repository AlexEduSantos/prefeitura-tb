import { PartialType } from '@nestjs/mapped-types';
import { CreateStoryItemDto } from './create-story-item.dto';

export class UpdateStoryItemDto extends PartialType(CreateStoryItemDto) {}
