import { IsString, IsOptional, MinLength } from 'class-validator';

export class CreateCardDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  content?: string;
}
