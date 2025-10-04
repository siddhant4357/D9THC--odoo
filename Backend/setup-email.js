import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🔧 Email Configuration Setup\n');
console.log('This will configure email for your Expense Manager app.\n');
console.log('Step 1: Get Gmail App Password');
console.log('  1. Go to: https://myaccount.google.com/security');
console.log('  2. Enable "2-Step Verification"');
console.log('  3. Go to: https://myaccount.google.com/apppasswords');
console.log('  4. Create App Password for "Mail" → "Other (Expense Manager)"');
console.log('  5. Copy the 16-character password\n');

rl.question('Enter your Gmail address: ', (email) => {
  rl.question('Enter your Gmail App Password (16 characters): ', (password) => {
    
    const envContent = `# Database
MONGODB_URI=mongodb://localhost:27017/expense-management

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production_12345

# Server
PORT=5000
NODE_ENV=development

# Email Configuration - Gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=${email.trim()}
EMAIL_PASS=${password.trim().replace(/\s/g, '')}
`;

    const envPath = path.join(__dirname, '.env');
    
    fs.writeFileSync(envPath, envContent);
    
    console.log('\n✅ Email configuration saved successfully!');
    console.log('\n📧 Configuration:');
    console.log(`   Email: ${email.trim()}`);
    console.log(`   Password: ${'*'.repeat(password.trim().length)}`);
    console.log('\n🚀 Please restart your backend server (Ctrl+C then npm run dev)');
    console.log('\nYou can now send passwords via email! 🎉\n');
    
    rl.close();
  });
});

