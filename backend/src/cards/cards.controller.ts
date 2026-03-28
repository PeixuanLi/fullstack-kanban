import {
  Controller,
  Post,
  Patch,
  Delete,
  Put,
  Body,
  Param,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { MoveCardDto } from './dto/move-card.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller()
export class CardsController {
  constructor(private cardsService: CardsService) {}

  @Post('lists/:listId/cards')
  create(
    @Req() req: { user: { userId: number } },
    @Param('listId', ParseIntPipe) listId: number,
    @Body() dto: CreateCardDto,
  ) {
    return this.cardsService.create(req.user.userId, listId, dto);
  }

  @Patch('cards/:id')
  update(
    @Req() req: { user: { userId: number } },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCardDto,
  ) {
    return this.cardsService.update(req.user.userId, id, dto);
  }

  @Delete('cards/:id')
  remove(@Req() req: { user: { userId: number } }, @Param('id', ParseIntPipe) id: number) {
    return this.cardsService.remove(req.user.userId, id);
  }

  @Put('cards/:id/move')
  move(
    @Req() req: { user: { userId: number } },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MoveCardDto,
  ) {
    return this.cardsService.move(req.user.userId, id, dto);
  }
}
