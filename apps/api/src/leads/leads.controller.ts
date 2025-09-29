import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { CreateLeadDto, UpdateLeadDto } from './dto/lead.dto';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Get()
  list(@Query() query: PaginationQueryDto) {
    return this.leads.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.leads.get(id);
  }

  @Post()
  create(@Body() body: CreateLeadDto) {
    return this.leads.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateLeadDto) {
    return this.leads.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.leads.remove(id);
  }
}
