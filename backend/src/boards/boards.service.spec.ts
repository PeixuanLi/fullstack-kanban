import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { BoardsService } from './boards.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BoardsService', () => {
  let service: BoardsService;
  let prisma: {
    board: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      board: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [BoardsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<BoardsService>(BoardsService);
  });

  describe('create', () => {
    it('should create a board', async () => {
      prisma.board.create.mockResolvedValue({ id: 1, title: 'Board', userId: 1 });
      const result = await service.create(1, { title: 'Board' });
      expect(result).toEqual({ id: 1, title: 'Board', userId: 1 });
    });
  });

  describe('findAll', () => {
    it('should return user boards', async () => {
      prisma.board.findMany.mockResolvedValue([]);
      const result = await service.findAll(1);
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return board when owned by user', async () => {
      const board = { id: 1, title: 'Board', userId: 1, lists: [] };
      prisma.board.findUnique.mockResolvedValue(board);
      const result = await service.findOne(1, 1);
      expect(result).toEqual(board);
    });

    it('should throw NotFound', async () => {
      prisma.board.findUnique.mockResolvedValue(null);
      await expect(service.findOne(1, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw Forbidden', async () => {
      prisma.board.findUnique.mockResolvedValue({ id: 1, userId: 2, lists: [] });
      await expect(service.findOne(1, 1)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update board', async () => {
      prisma.board.findUnique.mockResolvedValue({ id: 1, userId: 1, lists: [] });
      prisma.board.update.mockResolvedValue({ id: 1, title: 'New' });
      const result = await service.update(1, 1, { title: 'New' });
      expect(result.title).toBe('New');
    });
  });

  describe('remove', () => {
    it('should delete board', async () => {
      prisma.board.findUnique.mockResolvedValue({ id: 1, userId: 1, lists: [] });
      prisma.board.delete.mockResolvedValue({ id: 1 });
      const result = await service.remove(1, 1);
      expect(result.id).toBe(1);
    });
  });
});
