import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { UsersService } from '../users/users.service';

@Module({
  controllers: [TeamsController],
  providers: [UsersService],
})
export class TeamsModule {}
