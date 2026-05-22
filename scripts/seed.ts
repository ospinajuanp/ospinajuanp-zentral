import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import('../src/lib/seed.js').then((mod) => {
  mod
    .seed()
    .then(() => {
      console.log('Done');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
});
