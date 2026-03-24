import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { ApiKeyGuard, ApiKeyService } from './api-auth.guard';

@Module({
  controllers: [ApiController],
  providers: [ApiKeyGuard, ApiKeyService],
  exports: [ApiKeyService],
})
export class ApiModule {}
