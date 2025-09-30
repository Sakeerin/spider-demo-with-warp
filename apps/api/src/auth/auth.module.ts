import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.ADMIN_JWT_SECRET || 'devsecret',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
})
export class AuthModule {}
