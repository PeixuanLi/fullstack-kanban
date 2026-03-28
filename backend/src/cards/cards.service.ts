import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { MoveCardDto } from './dto/move-card.dto';

@Injectable()
export class CardsService {
  constructor(private prisma: PrismaService) {}

  private async verifyListOwnership(listId: number, userId: number) {
    const list = await this.prisma.list.findUnique({
      where: { id: listId },
      include: { board: true },
    });
    if (!list) throw new NotFoundException('List not found');
    if (list.board.userId !== userId) throw new ForbiddenException();
    return list;
  }

  private async verifyCardOwnership(cardId: number, userId: number) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: { list: { include: { board: true } } },
    });
    if (!card) throw new NotFoundException('Card not found');
    if (card.list.board.userId !== userId) throw new ForbiddenException();
    return card;
  }

  async create(userId: number, listId: number, dto: CreateCardDto) {
    await this.verifyListOwnership(listId, userId);

    const maxPosition = await this.prisma.card.aggregate({
      where: { listId },
      _max: { position: true },
    });

    const position = (maxPosition._max.position ?? -1) + 1;

    return this.prisma.card.create({
      data: { title: dto.title, content: dto.content, position, listId },
    });
  }

  async update(userId: number, id: number, dto: UpdateCardDto) {
    await this.verifyCardOwnership(id, userId);
    return this.prisma.card.update({
      where: { id },
      data: dto,
    });
  }

  async remove(userId: number, id: number) {
    await this.verifyCardOwnership(id, userId);
    return this.prisma.card.delete({ where: { id } });
  }

  async move(userId: number, id: number, dto: MoveCardDto) {
    const card = await this.verifyCardOwnership(id, userId);
    await this.verifyListOwnership(dto.listId, userId);

    const oldListId = card.listId;
    const oldPosition = card.position;
    const newListId = dto.listId;
    const newPosition = dto.position;

    return this.prisma.$transaction(async (tx) => {
      if (oldListId === newListId) {
        // Same list: shift positions between old and new
        if (oldPosition < newPosition) {
          await tx.card.updateMany({
            where: { listId: oldListId, position: { gt: oldPosition, lte: newPosition } },
            data: { position: { decrement: 1 } },
          });
        } else if (oldPosition > newPosition) {
          await tx.card.updateMany({
            where: { listId: oldListId, position: { gte: newPosition, lt: oldPosition } },
            data: { position: { increment: 1 } },
          });
        }
      } else {
        // Cross-list: decrement positions above old in source list
        await tx.card.updateMany({
          where: { listId: oldListId, position: { gt: oldPosition } },
          data: { position: { decrement: 1 } },
        });
        // Increment positions at or above new in target list
        await tx.card.updateMany({
          where: { listId: newListId, position: { gte: newPosition } },
          data: { position: { increment: 1 } },
        });
      }

      return tx.card.update({
        where: { id },
        data: { listId: newListId, position: newPosition },
      });
    });
  }
}
