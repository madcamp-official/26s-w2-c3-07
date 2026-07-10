import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './shared/utils/logger.js';

app.listen(env.PORT, () => {
  logger.info(`Backend listening on port ${env.PORT}`);
});
