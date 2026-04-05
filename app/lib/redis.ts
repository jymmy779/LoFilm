import { Redis } from '@upstash/redis';

// Export instance redis duy nhất. Khởi tạo lazy để không lỗi ở build time
// nếu biến môi trường chưa có.
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://dummy.upstash.io',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'dummy',
});

export default redis;
