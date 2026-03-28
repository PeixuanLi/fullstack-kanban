import { IsString, MinLength } from 'class-validator';

export class CreateListDto {
  @IsString()
  @MinLength(1)
  title: string;
}
