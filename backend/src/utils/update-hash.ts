import path from 'path';
import { updateFileHash } from './file-integrity';

const absPath = path.resolve(__dirname, '../index.ts');

updateFileHash(absPath)
  .then(() => {
    console.log('Hash updated!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error updating hash:', err);
    process.exit(1);
  }); 