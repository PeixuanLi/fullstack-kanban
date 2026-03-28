import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: { findUnique: jest.Mock; create: jest.Mock } };
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    jwtService = { sign: jest.fn().mockReturnValue('token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should create user and return token', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 1, username: 'test' });

      const result = await service.register({ username: 'test', password: '123456' });
      expect(result).toEqual({ access_token: 'token' });
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should throw if username exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1 });
      await expect(service.register({ username: 'test', password: '123456' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('login', () => {
    it('should return token for valid credentials', async () => {
      const hash = await bcrypt.hash('123456', 10);
      prisma.user.findUnique.mockResolvedValue({ id: 1, username: 'test', password: hash });

      const result = await service.login({ username: 'test', password: '123456' });
      expect(result).toEqual({ access_token: 'token' });
    });

    it('should throw for unknown user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.login({ username: 'test', password: '123456' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw for wrong password', async () => {
      const hash = await bcrypt.hash('other', 10);
      prisma.user.findUnique.mockResolvedValue({ id: 1, username: 'test', password: hash });

      await expect(service.login({ username: 'test', password: '123456' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
