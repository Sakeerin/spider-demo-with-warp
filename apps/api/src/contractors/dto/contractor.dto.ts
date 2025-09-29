import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateContractorDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  businessName: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  experience?: number;

  @IsOptional()
  @IsNumber()
  successRate?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  responseTime?: number;
}

export class UpdateContractorDto {
  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  experience?: number;

  @IsOptional()
  @IsNumber()
  successRate?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  responseTime?: number;
}
