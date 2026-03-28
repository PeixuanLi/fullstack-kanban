import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListDto } from './dto/create-list.dto';
import { ReorderListDto } from './dto/reorder-list.dto';

@Injectable()
export class ListsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, boardId: number, dto: CreateListDto) {
    const board = await this.prisma.board.findUnique({ where: { id: boardId } });
    if (!board) throw new NotFoundException('Board not found');
    if (board.userId !== userId) throw new ForbiddenException();

    const maxPosition = await this.prisma.list.aggregate({
      where: { boardId },
      _max: { position: true },
    });

    const position = (maxPosition._max.position ?? -1) + 1;

    return this.prisma.list.create({
      data: { title: dto.title, position, boardId },
    });
  }

  async update(userId: number, id: number, dto: { title?: string }) {
    const list = await this.prisma.list.findUnique({
      where: { id },
      include: { board: true },
    });
    if (!list) throw new NotFoundException('List not found');
    if (list.board.userId !== userId) throw new ForbiddenException();

    return this.prisma.list.update({
      where: { id },
      data: dto,
    });
  }

  async remove(userId: number, id: number) {
    const list = await this.prisma.list.findUnique({
      where: { id },
      include: { board: true },
    });
    if (!list) throw new NotFoundException('List not found');
    if (list.board.userId !== userId) throw new ForbiddenException();

    return this.prisma.list.delete({ where: { id } });
  }

  async reorder(userId: number, boardId: number, dto: ReorderListDto) {
    const board = await this.prisma.board.findUnique({ where: { id: boardId } });
    if (!board) throw new NotFoundException('Board not found');
    if (board.userId !== userId) throw new ForbiddenException();

    return this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.list.update({
          where: { id: item.listId },
          data: { position: item.position },
        }),
      ),
    );
  }
}
