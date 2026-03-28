import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Kanban E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let boardId: number;
  let listId1: number;
  let listId2: number;
  let cardId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.enableCors();

    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await app.close();
  });

  describe('Auth', () => {
    it('should register a user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'e2euser', password: '123456' })
        .expect(201)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
        });
    });

    it('should login', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'e2euser', password: '123456' })
        .expect(201)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
          token = res.body.access_token;
        });
    });

    it('should reject duplicate registration', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'e2euser', password: '123456' })
        .expect(401);
    });

    it('should reject bad credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'e2euser', password: 'wrong' })
        .expect(401);
    });
  });

  describe('Boards', () => {
    it('should create a board', () => {
      return request(app.getHttpServer())
        .post('/boards')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'My Board' })
        .expect(201)
        .expect((res) => {
          expect(res.body.title).toBe('My Board');
          boardId = res.body.id;
        });
    });

    it('should list boards', () => {
      return request(app.getHttpServer())
        .get('/boards')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should get board by id', () => {
      return request(app.getHttpServer())
        .get(`/boards/${boardId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('My Board');
          expect(res.body.lists).toBeDefined();
        });
    });

    it('should update board', () => {
      return request(app.getHttpServer())
        .patch(`/boards/${boardId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Board' })
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('Updated Board');
        });
    });

    it('should require auth', () => {
      return request(app.getHttpServer()).get('/boards').expect(401);
    });
  });

  describe('Lists', () => {
    it('should create lists', async () => {
      const res1 = await request(app.getHttpServer())
        .post(`/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Todo' })
        .expect(201);
      listId1 = res1.body.id;
      expect(res1.body.position).toBe(0);

      const res2 = await request(app.getHttpServer())
        .post(`/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Done' })
        .expect(201);
      listId2 = res2.body.id;
      expect(res2.body.position).toBe(1);
    });

    it('should update list title', () => {
      return request(app.getHttpServer())
        .patch(`/lists/${listId1}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'In Progress' })
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('In Progress');
        });
    });

    it('should reorder lists', () => {
      return request(app.getHttpServer())
        .put(`/boards/${boardId}/lists/reorder`)
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ listId: listId1, position: 1 }, { listId: listId2, position: 0 }] })
        .expect(200);
    });
  });

  describe('Cards', () => {
    it('should create cards', async () => {
      const res1 = await request(app.getHttpServer())
        .post(`/lists/${listId1}/cards`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Task 1' })
        .expect(201);
      expect(res1.body.position).toBe(0);

      const res2 = await request(app.getHttpServer())
        .post(`/lists/${listId1}/cards`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Task 2', content: 'Description' })
        .expect(201);
      cardId = res2.body.id;
      expect(res2.body.position).toBe(1);
      expect(res2.body.content).toBe('Description');
    });

    it('should update card', () => {
      return request(app.getHttpServer())
        .patch(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Task' })
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('Updated Task');
        });
    });

    it('should move card to another list', () => {
      return request(app.getHttpServer())
        .put(`/cards/${cardId}/move`)
        .set('Authorization', `Bearer ${token}`)
        .send({ listId: listId2, position: 0 })
        .expect(200)
        .expect((res) => {
          expect(res.body.listId).toBe(listId2);
          expect(res.body.position).toBe(0);
        });
    });

    it('should move card within same list', () => {
      return request(app.getHttpServer())
        .put(`/cards/${cardId}/move`)
        .set('Authorization', `Bearer ${token}`)
        .send({ listId: listId2, position: 5 })
        .expect(200);
    });
  });

  describe('Cleanup', () => {
    it('should delete card', () => {
      return request(app.getHttpServer())
        .delete(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should delete lists', async () => {
      await request(app.getHttpServer())
        .delete(`/lists/${listId1}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/lists/${listId2}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should delete board', () => {
      return request(app.getHttpServer())
        .delete(`/boards/${boardId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });
});
