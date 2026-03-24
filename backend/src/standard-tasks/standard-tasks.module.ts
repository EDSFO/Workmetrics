import { Module } from '@nestjs/common';
import { StandardTasksController } from './standard-tasks.controller';

@Module({
  controllers: [StandardTasksController],
  providers: [],
})
export class StandardTasksModule {}
