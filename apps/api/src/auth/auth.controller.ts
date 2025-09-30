import { Body, Controller, Post } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Admin Auth')
@Controller('admin/auth')
export class AuthController {
  constructor(private jwt: JwtService) {}

  @Post('login')
  login(@Body() body: { key: string; role?: 'admin' | 'coordinator' | 'sales' }) {
    const valid = body?.key && body.key === (process.env.ADMIN_API_KEY || 'changeme');
    if (!valid) {
      return { ok: false, error: 'INVALID_KEY' };
    }
    const role = body.role || 'admin';
    const token = this.jwt.sign({ role });
    return { ok: true, token, role };
  }
}
