import { api } from '../lib/api';

describe('API client', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  it('includes auth header when token exists', async () => {
    localStorage.setItem('token', 'test-token');
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'test' }),
    });
    global.fetch = mockFetch;

    await api.get('/test');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    );
  });

  it('sends JSON body with POST', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1 }),
    });
    global.fetch = mockFetch;

    await api.post('/boards', { title: 'Test' });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/boards',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'Test' }),
      })
    );
  });

  it('throws on non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'Server error' }),
    });

    await expect(api.get('/fail')).rejects.toThrow('Server error');
  });

  it('clears token on 401', async () => {
    localStorage.setItem('token', 'bad-token');
    delete (window as Record<string, unknown>).location;
    window.location = { href: '' } as Location;

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
    });

    await expect(api.get('/protected')).rejects.toThrow('Unauthorized');
    expect(localStorage.getItem('token')).toBeNull();
  });
});
