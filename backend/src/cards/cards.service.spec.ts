import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CardsService } from './cards.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CardsService', () => {
  let service: CardsService;
  let prisma: {
    card: {
      aggregate: jest.Mock;
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      updateMany: jest.Mock;
    };
    list: { findUnique: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      card: {
        aggregate: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        updateMany: jest.fn(),
      },
      list: { findUnique: jest.fn() },
      $transaction: jest.fn((fn) => fn(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [CardsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<CardsService>(CardsService);
  });

  describe('create', () => {
    it('should create card at next position', async () => {
      prisma.list.findUnique.mockResolvedValue({ id: 1, board: { userId: 1 } });
      prisma.card.aggregate.mockResolvedValue({ _max: { position: 0 } });
      prisma.card.create.mockResolvedValue({ id: 1, title: 'Card', position: 1, listId: 1 });

      const result = await service.create(1, 1, { title: 'Card' });
      expect(result.position).toBe(1);
    });

    it('should throw if list not found', async () => {
      prisma.list.findUnique.mockResolvedValue(null);
      await expect(service.create(1, 1, { title: 'Card' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update card', async () => {
      prisma.card.findUnique.mockResolvedValue({ id: 1, list: { board: { userId: 1 } } });
      prisma.card.update.mockResolvedValue({ id: 1, title: 'Updated' });

      const result = await service.update(1, 1, { title: 'Updated' });
      expect(result.title).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should delete card', async () => {
      prisma.card.findUnique.mockResolvedValue({ id: 1, list: { board: { userId: 1 } } });
      prisma.card.delete.mockResolvedValue({ id: 1 });

      const result = await service.remove(1, 1);
      expect(result.id).toBe(1);
    });
  });

  describe('move', () => {
    it('should move card within same list (up)', async () => {
      prisma.card.findUnique.mockResolvedValue({
        id: 1,
        listId: 1,
        position: 0,
        list: { board: { userId: 1 } },
      });
      prisma.list.findUnique
        .mockResolvedValueOnce({ id: 1, board: { userId: 1 } }) // verifyCardOwnership
        .mockResolvedValueOnce({ id: 1, board: { userId: 1 } }); // verifyListOwnership for target
      prisma.card.updateMany.mockResolvedValue({ count: 0 });
      prisma.card.update.mockResolvedValue({ id: 1, listId: 1, position: 2 });

      const result = await service.move(1, 1, { listId: 1, position: 2 });
      expect(prisma.card.updateMany).toHaveBeenCalled();
      expect(result.position).toBe(2);
    });

    it('should move card to different list', async () => {
      prisma.card.findUnique.mockResolvedValue({
        id: 1,
        listId: 1,
        position: 0,
        list: { board: { userId: 1 } },
      });
      prisma.list.findUnique
        .mockResolvedValueOnce({ id: 1, board: { userId: 1 } })
        .mockResolvedValueOnce({ id: 2, board: { userId: 1 } });
      prisma.card.updateMany.mockResolvedValue({ count: 0 });
      prisma.card.update.mockResolvedValue({ id: 1, listId: 2, position: 0 });

      const result = await service.move(1, 1, { listId: 2, position: 0 });
      expect(prisma.card.updateMany).toHaveBeenCalledTimes(2);
      expect(result.listId).toBe(2);
    });

    it('should throw Forbidden if not owner', async () => {
      prisma.card.findUnique.mockResolvedValue({ id: 1, list: { board: { userId: 2 } } });
      await expect(service.move(1, 1, { listId: 1, position: 0 })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
