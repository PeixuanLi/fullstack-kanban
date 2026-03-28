import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ListsService } from './lists.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ListsService', () => {
  let service: ListsService;
  let prisma: {
    board: { findUnique: jest.Mock };
    list: {
      aggregate: jest.Mock;
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      updateMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      board: { findUnique: jest.fn() },
      list: {
        aggregate: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn((ops) => Promise.all(typeof ops === 'function' ? [ops(prisma)] : ops)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ListsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ListsService>(ListsService);
  });

  describe('create', () => {
    it('should create list at next position', async () => {
      prisma.board.findUnique.mockResolvedValue({ id: 1, userId: 1 });
      prisma.list.aggregate.mockResolvedValue({ _max: { position: 2 } });
      prisma.list.create.mockResolvedValue({ id: 1, title: 'Todo', position: 3, boardId: 1 });

      const result = await service.create(1, 1, { title: 'Todo' });
      expect(result.position).toBe(3);
    });

    it('should create list at position 0 when no lists', async () => {
      prisma.board.findUnique.mockResolvedValue({ id: 1, userId: 1 });
      prisma.list.aggregate.mockResolvedValue({ _max: { position: null } });
      prisma.list.create.mockResolvedValue({ id: 1, title: 'Todo', position: 0, boardId: 1 });

      const result = await service.create(1, 1, { title: 'Todo' });
      expect(result.position).toBe(0);
    });

    it('should throw if board not found', async () => {
      prisma.board.findUnique.mockResolvedValue(null);
      await expect(service.create(1, 1, { title: 'Todo' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update list title', async () => {
      prisma.list.findUnique.mockResolvedValue({ id: 1, board: { userId: 1 } });
      prisma.list.update.mockResolvedValue({ id: 1, title: 'Done' });

      const result = await service.update(1, 1, { title: 'Done' });
      expect(result.title).toBe('Done');
    });
  });

  describe('remove', () => {
    it('should delete list', async () => {
      prisma.list.findUnique.mockResolvedValue({ id: 1, board: { userId: 1 } });
      prisma.list.delete.mockResolvedValue({ id: 1 });

      const result = await service.remove(1, 1);
      expect(result.id).toBe(1);
    });

    it('should throw Forbidden if not owner', async () => {
      prisma.list.findUnique.mockResolvedValue({ id: 1, board: { userId: 2 } });
      await expect(service.remove(1, 1)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('reorder', () => {
    it('should reorder lists', async () => {
      prisma.board.findUnique.mockResolvedValue({ id: 1, userId: 1 });
      prisma.list.update.mockResolvedValue({});

      const items = [
        { listId: 1, position: 0 },
        { listId: 2, position: 1 },
      ];
      await service.reorder(1, 1, { items });
      expect(prisma.list.update).toHaveBeenCalledTimes(2);
    });
  });
});
