const request = require('supertest');
const app = require('../src/app'); // Assurez-vous que ce chemin est correct

describe('Server Tests', () => {
  it('should respond to health check', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
  });
});


