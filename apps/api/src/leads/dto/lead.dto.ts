import { IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateLeadDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsString()
  @IsNotEmpty()
  serviceType: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsInt()
  @Min(0)
  budgetMin: number;

  @IsInt()
  @Min(0)
  budgetMax: number;

  @IsString()
  @IsNotEmpty()
  urgency: string; // could be enum low|medium|high later

  @IsString()
  @IsNotEmpty()
  status: string;
}

export class UpdateLeadDto {
  @IsOptional()
  @IsString()
  serviceType?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  budgetMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  budgetMax?: number;

  @IsOptional()
  @IsString()
  urgency?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
