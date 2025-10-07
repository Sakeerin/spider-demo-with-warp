import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiTags } from '@nestjs/swagger';
import { JwtGuard } from './jwt.guard';

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

  @Get('me')
  @UseGuards(JwtGuard)
  me(@Req() req: any) {
    const role = req.user?.role || null;
    return { ok: true, role };
  }
}
