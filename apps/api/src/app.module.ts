import { Module } from '@nestjs/common';
import { AppController } from './modules/app.controller';
import { LeadsModule } from './leads/leads.module';
import { ContractorsModule } from './contractors/contractors.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [LeadsModule, ContractorsModule, AdminModule, AuthModule],
  controllers: [AppController],
})
export class AppModule {}
