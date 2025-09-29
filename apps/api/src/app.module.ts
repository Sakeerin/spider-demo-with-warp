import { Module } from '@nestjs/common';
import { AppController } from './modules/app.controller';
import { LeadsModule } from './leads/leads.module';
import { ContractorsModule } from './contractors/contractors.module';

@Module({
  imports: [LeadsModule, ContractorsModule],
  controllers: [AppController],
})
export class AppModule {}
