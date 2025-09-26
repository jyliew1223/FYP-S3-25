import { CustomApiRequest, BaseApiResponse, RequestMethod } from '../ApiHelper';

// Mock fetch globally
global.fetch = jest.fn();

// Mock Firebase App Check
jest.mock('@react-native-firebase/app-check', () => {
  return () => ({
    getToken: jest.fn().mockResolvedValue({ token: 'FAKE_APPCHECK_TOKEN' }),
  });
});

describe('CustomApiRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends GET request and parses response successfully', async () => {
    // Arrange mock fetch response
    const mockJson = { success: true, message: 'Hello', errors: null };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockJson),
    });

    // Create request
    const request = new CustomApiRequest(
      RequestMethod.GET,
      'https://api.example.com',
      '/test-endpoint',
      { param1: 'value' },
    );

    // Act
    const success = await request.sendRequest(BaseApiResponse);

    // Assert
    expect(success).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('param1=value'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'X-Firebase-AppCheck': 'FAKE_APPCHECK_TOKEN',
        }),
      }),
    );

    const response = request.Response;
    expect(response.success).toBe(true);
    expect(response.message).toBe('Hello');
    expect(response.status).toBe(200);
  });

  it('handles non-OK response correctly', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ success: false, message: 'Bad Request' }),
    });

    const request = new CustomApiRequest(
      RequestMethod.POST,
      'https://api.example.com',
      '/fail-endpoint',
      { data: 'test' },
    );

    const success = await request.sendRequest(BaseApiResponse);

    expect(success).toBe(false);
    const response = request.Response;
    expect(response.success).toBe(false);
    expect(response.message).toBe('Bad Request');
    expect(response.status).toBe(400);
  });

  it('handles invalid JSON gracefully', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => 'INVALID_JSON',
    });

    const request = new CustomApiRequest(
      RequestMethod.GET,
      'https://api.example.com',
      '/invalid-json',
      null,
    );

    const success = await request.sendRequest(BaseApiResponse);

    // Success is true because res.ok is true, even though JSON parsing failed
    expect(success).toBe(true);
    expect(request.Response).toBeInstanceOf(BaseApiResponse);
  });
});
