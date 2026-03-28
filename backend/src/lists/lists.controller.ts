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
import { ListsService } from './lists.service';
import { CreateListDto } from './dto/create-list.dto';
import { ReorderListDto } from './dto/reorder-list.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller()
export class ListsController {
  constructor(private listsService: ListsService) {}

  @Post('boards/:boardId/lists')
  create(
    @Req() req: { user: { userId: number } },
    @Param('boardId', ParseIntPipe) boardId: number,
    @Body() dto: CreateListDto,
  ) {
    return this.listsService.create(req.user.userId, boardId, dto);
  }

  @Patch('lists/:id')
  update(
    @Req() req: { user: { userId: number } },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { title?: string },
  ) {
    return this.listsService.update(req.user.userId, id, dto);
  }

  @Delete('lists/:id')
  remove(@Req() req: { user: { userId: number } }, @Param('id', ParseIntPipe) id: number) {
    return this.listsService.remove(req.user.userId, id);
  }

  @Put('boards/:boardId/lists/reorder')
  reorder(
    @Req() req: { user: { userId: number } },
    @Param('boardId', ParseIntPipe) boardId: number,
    @Body() dto: ReorderListDto,
  ) {
    return this.listsService.reorder(req.user.userId, boardId, dto);
  }
}
