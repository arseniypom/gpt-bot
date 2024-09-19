import fs from 'fs';
import path from 'path';

const HISTORY_DIR = './history';
export const MAX_HISTORY_LENGTH = 6;

if (!fs.existsSync(HISTORY_DIR)) {
  fs.mkdirSync(HISTORY_DIR);
}

export const loadUserHistory = (userId: number): Array<{ role: string, content: string }> => {
  const filePath = path.join(HISTORY_DIR, `${userId}.json`);
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  }
  return [];
};

export const saveUserHistory = (userId: number, history: Array<{ role: string, content: string }>) => {
  const filePath = path.join(HISTORY_DIR, `${userId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(history, null, 2));
};
