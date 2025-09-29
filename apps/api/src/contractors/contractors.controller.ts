import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ContractorsService } from './contractors.service';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { CreateContractorDto, UpdateContractorDto } from './dto/contractor.dto';

@Controller('contractors')
export class ContractorsController {
  constructor(private readonly contractors: ContractorsService) {}

  @Get()
  list(@Query() query: PaginationQueryDto) {
    return this.contractors.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.contractors.get(id);
  }

  @Post()
  create(@Body() body: CreateContractorDto) {
    return this.contractors.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateContractorDto) {
    return this.contractors.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contractors.remove(id);
  }
}
