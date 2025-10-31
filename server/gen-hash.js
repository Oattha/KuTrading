// gen-hash.js run : node gen-hash.js
import bcrypt from 'bcryptjs';

const plain = 'admin123@';
const saltRounds = 10;
const hash = bcrypt.hashSync(plain, saltRounds);
console.log(hash);
