
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config({ path: 'c:\\delivered_ontime\\backend\\.env' });

async function checkData() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      dateStrings: ['DATE']
    });

    const messenger = 'M. Rizky Rinaldy';
    console.log(`Checking deliveries for: ${messenger}`);

    const [rows] = await pool.query(
      'SELECT id, invoice, sent_date, messenger FROM deliveries WHERE messenger LIKE ? ORDER BY sent_date DESC LIMIT 20',
      [`%${messenger}%`]
    );

    console.log('Found rows:', rows.length);
    rows.forEach(r => {
      console.log(`ID: ${r.id}, Invoice: ${r.invoice}, SentDate: ${r.sent_date} (Type: ${typeof r.sent_date}), Messenger: ${r.messenger}`);
    });
    
    // Check specifically for 2025-12-17
    const [rows17] = await pool.query(
        'SELECT count(*) as c FROM deliveries WHERE sent_date = ? AND messenger LIKE ?',
        ['2025-12-17', `%${messenger}%`]
    );
    console.log(`Count for 2025-12-17: ${rows17[0].c}`);

    // Check specifically for 2025-12-16
    const [rows16] = await pool.query(
        'SELECT count(*) as c FROM deliveries WHERE sent_date = ? AND messenger LIKE ?',
        ['2025-12-16', `%${messenger}%`]
    );
    console.log(`Count for 2025-12-16: ${rows16[0].c}`);

    await pool.end();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkData();
