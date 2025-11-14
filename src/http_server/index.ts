import { createServer, Server } from 'http';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const httpServer: Server = createServer(async (req, res) => {
  try {
    const basePath = join(__dirname, '../../../front');
    const filePath = req.url === '/' 
      ? join(basePath, 'index.html')
      : join(basePath, req.url!);
    
    const content = await readFile(filePath);
    res.writeHead(200);
    res.end(content);
  } catch (err) {
    res.writeHead(404);
    res.end(JSON.stringify(err));
  }
});
