import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('boards')
export class BoardsController {
  constructor(private boardsService: BoardsService) {}

  @Post()
  create(@Req() req: { user: { userId: number } }, @Body() dto: CreateBoardDto) {
    return this.boardsService.create(req.user.userId, dto);
  }

  @Get()
  findAll(@Req() req: { user: { userId: number } }) {
    return this.boardsService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Req() req: { user: { userId: number } }, @Param('id', ParseIntPipe) id: number) {
    return this.boardsService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  update(
    @Req() req: { user: { userId: number } },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBoardDto,
  ) {
    return this.boardsService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: { user: { userId: number } }, @Param('id', ParseIntPipe) id: number) {
    return this.boardsService.remove(req.user.userId, id);
  }
}
