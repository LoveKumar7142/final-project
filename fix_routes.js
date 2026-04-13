import fs from 'fs';
import path from 'path';

const dirs = ['backend/routes/public', 'backend/routes/_x9f_protected_core'];
dirs.forEach(d => {
  const p = path.join(process.cwd(), d);
  fs.readdirSync(p).forEach(f => {
    const fp = path.join(p, f);
    let c = fs.readFileSync(fp, 'utf8');
    if (c.includes('"../')) {
      fs.writeFileSync(fp, c.replace(/"\.\.\//g, '"../../'));
      console.log('Fixed', fp);
    }
  });
});
