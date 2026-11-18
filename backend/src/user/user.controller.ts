import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SessionGuard } from '../auth/session.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/check-policies.decorator';
import { Action } from '../casl/action.enum';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(SessionGuard, PoliciesGuard)
  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, 'Admin'))
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Post(':id/resend-activation')
  @CheckPolicies((ability) => ability.can(Action.Update, 'Admin'))
  resendActivation(@Param('id') id: string) {
    return this.userService.resendActivationLink(id);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Get()
  @CheckPolicies((ability) => ability.can(Action.Read, 'Admin'))
  findAll() {
    return this.userService.findAll();
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Get(':id')
  @CheckPolicies((ability) => ability.can(Action.Read, 'Admin'))
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'Admin'))
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Admin'))
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
