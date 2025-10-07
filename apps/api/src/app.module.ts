import { Module } from '@nestjs/common';
import { AppController } from './modules/app.controller';
import { LeadsModule } from './leads/leads.module';
import { ContractorsModule } from './contractors/contractors.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    BullModule.forRoot({
      redis: { host: process.env.REDIS_HOST || 'redis', port: Number(process.env.REDIS_PORT || 6379) },
    }),
    LeadsModule,
    ContractorsModule,
    AdminModule,
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
