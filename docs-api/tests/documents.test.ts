import app from '../src/index';

describe('Documents API', () => {
  test('GET /health should return healthy status', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.message).toBe('API is healthy');
  });

  test('GET /api/documents should return documents list', async () => {
    const res = await app.request('/api/documents');
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('documents');
  });

  test('POST /api/documents/presigned-url should generate URLs', async () => {
    const requestBody = {
      fileName: 'test.pdf',
      mimeType: 'application/pdf'
    };

    const res = await app.request('/api/documents/presigned-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('uploadUrl');
    expect(data.data).toHaveProperty('downloadUrl');
    expect(data.data).toHaveProperty('s3Key');
  });

  test('GET /nonexistent should return 404', async () => {
    const res = await app.request('/nonexistent');
    expect(res.status).toBe(404);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Not Found');
  });
});
