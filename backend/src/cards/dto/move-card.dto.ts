import { IsInt } from 'class-validator';

export class MoveCardDto {
  @IsInt()
  listId: number;

  @IsInt()
  position: number;
}
