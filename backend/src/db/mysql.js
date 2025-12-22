import dotenv from 'dotenv'
import mysql from 'mysql2/promise'

dotenv.config()

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  dateStrings: ['DATE']
})

export const query = async (sql, params = []) => {
  const [rows] = await pool.query(sql, params)
  return rows
}

export default pool
export const ensureSchema = async () => {
  const safe = async (fn) => { try { await fn() } catch (e) {} }
  await safe(() => query('CREATE TABLE IF NOT EXISTS users (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), email VARCHAR(255) NOT NULL, password VARCHAR(255) NOT NULL, role VARCHAR(50) DEFAULT "messenger", status VARCHAR(50) DEFAULT "active", phone VARCHAR(50), profile_image TEXT, vehicle_info TEXT, is_active TINYINT(1) DEFAULT 1, last_login DATETIME NULL, login_attempts INT DEFAULT 0)'))
  await safe(() => query('CREATE TABLE IF NOT EXISTS customers (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, nama_customer VARCHAR(255) NOT NULL, no_hp VARCHAR(50), alamat TEXT, google_maps TEXT, image TEXT)'))
  await safe(() => query('CREATE TABLE IF NOT EXISTS deliveries (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, customer VARCHAR(255), customer_id INT, invoice VARCHAR(100) NOT NULL, item VARCHAR(255) NOT NULL, sent_date DATE NOT NULL, delivered_date DATE, messenger VARCHAR(255) NOT NULL, recipient VARCHAR(255), notes TEXT, status VARCHAR(50), courier_id INT, bbm_record_id INT, actual_delivery_date DATE, created_by INT)'))
  await safe(() => query('CREATE TABLE IF NOT EXISTS bbm_records (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, tanggal DATE NOT NULL, kilometer_awal INT NOT NULL, kilometer_akhir INT NOT NULL, messenger VARCHAR(255) NOT NULL, attachment VARCHAR(255), courier_id INT, created_by INT)'))
  await safe(() => query('CREATE TABLE IF NOT EXISTS attachments (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, delivery_id INT NOT NULL, original_filename VARCHAR(255) NOT NULL, stored_filename VARCHAR(255) NOT NULL, file_path TEXT NOT NULL, file_size VARCHAR(50), mime_type VARCHAR(100), uploaded_by INT, upload_purpose VARCHAR(50))'))
  await safe(() => query('CREATE TABLE IF NOT EXISTS bbm_attachments (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, bbm_record_id INT NOT NULL, original_filename VARCHAR(255) NOT NULL, stored_filename VARCHAR(255) NOT NULL, file_path TEXT NOT NULL, file_size VARCHAR(50), mime_type VARCHAR(100), uploaded_by INT)'))
  await safe(() => query('CREATE TABLE IF NOT EXISTS daily_reports (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, date DATE NOT NULL, invoice_count INT, km_awal INT, km_akhir INT, total_km INT)'))
  await safe(() => query('CREATE TABLE IF NOT EXISTS reports (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, report_type VARCHAR(50) NOT NULL, date_from DATE, date_to DATE, messenger_name VARCHAR(255), report_data TEXT, file_path TEXT, file_type VARCHAR(50) NOT NULL, generated_by INT, status VARCHAR(50))'))
  const checkAuto = async (table) => {
    const rows = await query(
      'SELECT EXTRA FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME="id"',
      [process.env.DB_NAME, table]
    )
    if (rows.length && String(rows[0].EXTRA || '').toLowerCase().includes('auto_increment')) return
    await query(`ALTER TABLE ${table} MODIFY id INT NOT NULL AUTO_INCREMENT`)
  }
  await safe(() => checkAuto('users'))
  await safe(() => checkAuto('customers'))
  await safe(() => checkAuto('deliveries'))
  await safe(() => checkAuto('bbm_records'))
  await safe(() => checkAuto('attachments'))
  await safe(() => checkAuto('bbm_attachments'))
  await safe(() => checkAuto('daily_reports'))
  await safe(() => checkAuto('reports'))
  await safe(() => query('ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until DATETIME NULL'))
  await safe(() => query('ALTER TABLE users ADD COLUMN IF NOT EXISTS last_password_change DATETIME NULL'))
  await safe(() => query('ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'))
  await safe(() => query('ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
  const idxUsersRole = await query('SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=? AND TABLE_NAME="users" AND INDEX_NAME="idx_users_role"',[process.env.DB_NAME])
  if (!idxUsersRole[0] || !idxUsersRole[0].c) {
    await safe(() => query('ALTER TABLE users ADD INDEX idx_users_role (role)'))
  }
  await safe(() => query('ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS courier_id INT NULL'))
  await safe(() => query('ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS generated_by INT NULL'))
  await safe(() => query('ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'))
  await safe(() => query('ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
  const idxDailyUnique = await query('SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=? AND TABLE_NAME="daily_reports" AND INDEX_NAME="unique_courier_date"',[process.env.DB_NAME])
  if (!idxDailyUnique[0] || !idxDailyUnique[0].c) {
    await safe(() => query('ALTER TABLE daily_reports ADD UNIQUE KEY unique_courier_date (courier_id, date)'))
  }
  const idxDailyDate = await query('SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=? AND TABLE_NAME="daily_reports" AND INDEX_NAME="idx_daily_date"',[process.env.DB_NAME])
  if (!idxDailyDate[0] || !idxDailyDate[0].c) {
    await safe(() => query('ALTER TABLE daily_reports ADD INDEX idx_daily_date (date)'))
  }
  const fkDailyCourier = await query('SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=? AND TABLE_NAME="daily_reports" AND COLUMN_NAME="courier_id" AND REFERENCED_TABLE_NAME IS NOT NULL',[process.env.DB_NAME])
  if (!fkDailyCourier[0] || !fkDailyCourier[0].c) {
    await safe(() => query('ALTER TABLE daily_reports ADD CONSTRAINT fk_daily_courier FOREIGN KEY (courier_id) REFERENCES users(id) ON DELETE SET NULL'))
  }
  const fkDailyGenBy = await query('SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=? AND TABLE_NAME="daily_reports" AND COLUMN_NAME="generated_by" AND REFERENCED_TABLE_NAME IS NOT NULL',[process.env.DB_NAME])
  if (!fkDailyGenBy[0] || !fkDailyGenBy[0].c) {
    await safe(() => query('ALTER TABLE daily_reports ADD CONSTRAINT fk_daily_generated_by FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL'))
  }
  const trigIns = await query('SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.TRIGGERS WHERE TRIGGER_SCHEMA=? AND TRIGGER_NAME="calculate_daily_total_km"',[process.env.DB_NAME])
  if (!trigIns[0] || !trigIns[0].c) {
    await safe(() => query('CREATE TRIGGER calculate_daily_total_km BEFORE INSERT ON daily_reports FOR EACH ROW SET NEW.total_km = IFNULL(NEW.km_akhir,0) - IFNULL(NEW.km_awal,0)'))
  }
  const trigUpd = await query('SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.TRIGGERS WHERE TRIGGER_SCHEMA=? AND TRIGGER_NAME="update_daily_total_km"',[process.env.DB_NAME])
  if (!trigUpd[0] || !trigUpd[0].c) {
    await safe(() => query('CREATE TRIGGER update_daily_total_km BEFORE UPDATE ON daily_reports FOR EACH ROW SET NEW.total_km = IFNULL(NEW.km_akhir,0) - IFNULL(NEW.km_awal,0)'))
  }
  await safe(() => query('ALTER TABLE attachments MODIFY file_path VARCHAR(500) NOT NULL'))
  await safe(() => query('ALTER TABLE attachments MODIFY upload_purpose VARCHAR(255) DEFAULT "delivery_proof"'))
  await safe(() => query('ALTER TABLE attachments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'))
  const fkAttDel = await query('SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=? AND TABLE_NAME="attachments" AND COLUMN_NAME="delivery_id" AND REFERENCED_TABLE_NAME IS NOT NULL',[process.env.DB_NAME])
  if (!fkAttDel[0] || !fkAttDel[0].c) {
    await safe(() => query('ALTER TABLE attachments ADD CONSTRAINT fk_attachments_delivery FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE CASCADE'))
  }
  const fkAttUser = await query('SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=? AND TABLE_NAME="attachments" AND COLUMN_NAME="uploaded_by" AND REFERENCED_TABLE_NAME IS NOT NULL',[process.env.DB_NAME])
  if (!fkAttUser[0] || !fkAttUser[0].c) {
    await safe(() => query('ALTER TABLE attachments ADD CONSTRAINT fk_attachments_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE'))
  }
  await safe(() => query('ALTER TABLE bbm_attachments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'))
  const fkBbmAtt = await query('SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=? AND TABLE_NAME="bbm_attachments" AND COLUMN_NAME="bbm_record_id" AND REFERENCED_TABLE_NAME IS NOT NULL',[process.env.DB_NAME])
  if (!fkBbmAtt[0] || !fkBbmAtt[0].c) {
    await safe(() => query('ALTER TABLE bbm_attachments ADD CONSTRAINT fk_bbm_attachments_record FOREIGN KEY (bbm_record_id) REFERENCES bbm_records(id) ON DELETE CASCADE'))
  }
  const fkBbmAttUser = await query('SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=? AND TABLE_NAME="bbm_attachments" AND COLUMN_NAME="uploaded_by" AND REFERENCED_TABLE_NAME IS NOT NULL',[process.env.DB_NAME])
  if (!fkBbmAttUser[0] || !fkBbmAttUser[0].c) {
    await safe(() => query('ALTER TABLE bbm_attachments ADD CONSTRAINT fk_bbm_attachments_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE'))
  }
  await safe(() => query('CREATE TABLE IF NOT EXISTS customer_attachments (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, customer_id INT NOT NULL, original_filename VARCHAR(255) NOT NULL, stored_filename VARCHAR(255) NOT NULL, file_path VARCHAR(500) NOT NULL, file_size VARCHAR(50), mime_type VARCHAR(100), uploaded_by INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)'))
  const fkCustAtt = await query('SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=? AND TABLE_NAME="customer_attachments" AND COLUMN_NAME="customer_id" AND REFERENCED_TABLE_NAME IS NOT NULL',[process.env.DB_NAME])
  if (!fkCustAtt[0] || !fkCustAtt[0].c) {
    await safe(() => query('ALTER TABLE customer_attachments ADD CONSTRAINT fk_customer_attachments_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE'))
  }
  const fkCustAttUser = await query('SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=? AND TABLE_NAME="customer_attachments" AND COLUMN_NAME="uploaded_by" AND REFERENCED_TABLE_NAME IS NOT NULL',[process.env.DB_NAME])
  if (!fkCustAttUser[0] || !fkCustAttUser[0].c) {
    await safe(() => query('ALTER TABLE customer_attachments ADD CONSTRAINT fk_customer_attachments_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE'))
  }
  await safe(() => query('ALTER TABLE reports MODIFY report_type ENUM("delivery_summary","bbm_summary","daily_report","customer_report") NOT NULL'))
  await safe(() => query('ALTER TABLE reports MODIFY file_type ENUM("pdf","excel") NOT NULL'))
  await safe(() => query('ALTER TABLE reports MODIFY status ENUM("generating","completed","failed")'))
  await safe(() => query('ALTER TABLE reports ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'))
  const idxReports = await query('SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=? AND TABLE_NAME="reports" AND INDEX_NAME="idx_reports_type_range"',[process.env.DB_NAME])
  if (!idxReports[0] || !idxReports[0].c) {
    await safe(() => query('ALTER TABLE reports ADD INDEX idx_reports_type_range (report_type, date_from, date_to)'))
  }
  const fkReportsGen = await query('SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=? AND TABLE_NAME="reports" AND COLUMN_NAME="generated_by" AND REFERENCED_TABLE_NAME IS NOT NULL',[process.env.DB_NAME])
  if (!fkReportsGen[0] || !fkReportsGen[0].c) {
    await safe(() => query('ALTER TABLE reports ADD CONSTRAINT fk_reports_generated_by FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE CASCADE'))
  }
  const idxInv = await query('SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=? AND TABLE_NAME="deliveries" AND INDEX_NAME="uniq_deliveries_invoice"',[process.env.DB_NAME])
  if (!idxInv[0] || !idxInv[0].c) {
    await safe(() => query('ALTER TABLE deliveries ADD UNIQUE KEY uniq_deliveries_invoice (invoice)'))
  }
  await safe(() => query('ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'))
  await safe(() => query('ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
  const idxActualDate = await query('SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=? AND TABLE_NAME="deliveries" AND INDEX_NAME="idx_actual_delivery_date"',[process.env.DB_NAME])
  if (!idxActualDate[0] || !idxActualDate[0].c) {
    await safe(() => query('ALTER TABLE deliveries ADD INDEX idx_actual_delivery_date (actual_delivery_date)'))
  }
  const fkDelCourier = await query('SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=? AND TABLE_NAME="deliveries" AND COLUMN_NAME="courier_id" AND REFERENCED_TABLE_NAME IS NOT NULL',[process.env.DB_NAME])
  if (!fkDelCourier[0] || !fkDelCourier[0].c) {
    await safe(() => query('ALTER TABLE deliveries ADD CONSTRAINT fk_deliveries_courier FOREIGN KEY (courier_id) REFERENCES users(id) ON DELETE SET NULL'))
  }
  const fkDelCreatedBy = await query('SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=? AND TABLE_NAME="deliveries" AND COLUMN_NAME="created_by" AND REFERENCED_TABLE_NAME IS NOT NULL',[process.env.DB_NAME])
  if (!fkDelCreatedBy[0] || !fkDelCreatedBy[0].c) {
    await safe(() => query('ALTER TABLE deliveries ADD CONSTRAINT fk_deliveries_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL'))
  }
  const fkDelCustomer = await query('SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=? AND TABLE_NAME="deliveries" AND COLUMN_NAME="customer_id" AND REFERENCED_TABLE_NAME IS NOT NULL',[process.env.DB_NAME])
  if (!fkDelCustomer[0] || !fkDelCustomer[0].c) {
    await safe(() => query('ALTER TABLE deliveries ADD CONSTRAINT fk_deliveries_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL'))
  }
  const fkDelBbm = await query('SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=? AND TABLE_NAME="deliveries" AND COLUMN_NAME="bbm_record_id" AND REFERENCED_TABLE_NAME IS NOT NULL',[process.env.DB_NAME])
  if (!fkDelBbm[0] || !fkDelBbm[0].c) {
    await safe(() => query('ALTER TABLE deliveries ADD CONSTRAINT fk_deliveries_bbm_record FOREIGN KEY (bbm_record_id) REFERENCES bbm_records(id) ON DELETE SET NULL'))
  }
  await safe(() => query('ALTER TABLE bbm_records ADD COLUMN IF NOT EXISTS total_kilometer INT NULL'))
  await safe(() => query('ALTER TABLE bbm_records ADD COLUMN IF NOT EXISTS jumlah_bbm_rupiah DECIMAL(12,2) DEFAULT 0'))
  await safe(() => query('ALTER TABLE bbm_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'))
  await safe(() => query('ALTER TABLE bbm_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
  const trigBbmIns = await query('SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.TRIGGERS WHERE TRIGGER_SCHEMA=? AND TRIGGER_NAME="calculate_bbm_total_km"',[process.env.DB_NAME])
  if (!trigBbmIns[0] || !trigBbmIns[0].c) {
    await safe(() => query('CREATE TRIGGER calculate_bbm_total_km BEFORE INSERT ON bbm_records FOR EACH ROW SET NEW.total_kilometer = IFNULL(NEW.kilometer_akhir,0) - IFNULL(NEW.kilometer_awal,0)'))
  }
  const trigBbmUpd = await query('SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.TRIGGERS WHERE TRIGGER_SCHEMA=? AND TRIGGER_NAME="update_bbm_total_km"',[process.env.DB_NAME])
  if (!trigBbmUpd[0] || !trigBbmUpd[0].c) {
    await safe(() => query('CREATE TRIGGER update_bbm_total_km BEFORE UPDATE ON bbm_records FOR EACH ROW SET NEW.total_kilometer = IFNULL(NEW.kilometer_akhir,0) - IFNULL(NEW.kilometer_awal,0)'))
  }
  const hasView = await query('SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_SCHEMA=? AND TABLE_NAME="frontend_bbm_data"',[process.env.DB_NAME])
  if (!hasView[0] || !hasView[0].c) {
    await safe(() => query('CREATE VIEW frontend_bbm_data AS SELECT DATE_FORMAT(tanggal, "%d %b %Y") AS tanggal, kilometer_awal AS kilometerAwal, kilometer_akhir AS kilometerAkhir, total_kilometer AS totalKilometer, ROUND(jumlah_bbm_rupiah, 0) AS jumlahBbmRupiah, FORMAT(jumlah_bbm_rupiah, 0) AS jumlahBbmRupiahFormatted, messenger, attachment FROM bbm_records ORDER BY tanggal DESC'))
  }
  await safe(() => query('CREATE TABLE IF NOT EXISTS settings (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, fuel_price DECIMAL(12,2) NOT NULL DEFAULT 10000, km_per_liter DECIMAL(12,2) NOT NULL DEFAULT 35, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)'))
  const settingsCount = await query('SELECT COUNT(*) as c FROM settings')
  if (!settingsCount[0] || !settingsCount[0].c) {
    await safe(() => query('INSERT INTO settings (fuel_price, km_per_liter) VALUES (10000, 35)'))
  }
  await safe(() => query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_name VARCHAR(255) NULL'))
  await safe(() => query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_address VARCHAR(500) NULL'))
  await safe(() => query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_phone VARCHAR(100) NULL'))
  await safe(() => query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_email VARCHAR(255) NULL'))
  await safe(() => query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_logo VARCHAR(500) NULL'))
  const hasCustView = await query('SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_SCHEMA=? AND TABLE_NAME="frontend_customer_data"',[process.env.DB_NAME])
  if (!hasCustView[0] || !hasCustView[0].c) {
    await safe(() => query('CREATE VIEW frontend_customer_data AS SELECT nama_customer AS namaCustomer, no_hp AS noHp, alamat, google_maps AS googleMaps, image FROM customers ORDER BY nama_customer'))
  }
  await safe(() => query('ALTER TABLE customers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'))
  await safe(() => query('ALTER TABLE customers ADD COLUMN IF NOT EXISTS created_by INT NULL'))
  const fkCustCreatedBy = await query('SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=? AND TABLE_NAME="customers" AND COLUMN_NAME="created_by" AND REFERENCED_TABLE_NAME IS NOT NULL',[process.env.DB_NAME])
  if (!fkCustCreatedBy[0] || !fkCustCreatedBy[0].c) {
    await safe(() => query('ALTER TABLE customers ADD CONSTRAINT fk_customers_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL'))
  }
  const hasDeliveredView = await query('SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_SCHEMA=? AND TABLE_NAME="frontend_delivered_data"',[process.env.DB_NAME])
  if (!hasDeliveredView[0] || !hasDeliveredView[0].c) {
    await safe(() => query('CREATE VIEW frontend_delivered_data AS SELECT customer, invoice, item, DATE_FORMAT(sent_date, "%d %b %Y") AS sentDate, DATE_FORMAT(delivered_date, "%d %b %Y") AS deliveredDate, messenger, recipient, notes, status FROM deliveries ORDER BY actual_delivery_date DESC, id DESC'))
  }
  const hasReportView = await query('SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_SCHEMA=? AND TABLE_NAME="frontend_report_data"',[process.env.DB_NAME])
  if (!hasReportView[0] || !hasReportView[0].c) {
    await safe(() => query('CREATE VIEW frontend_report_data AS SELECT DATE_FORMAT(date, "%d %b %Y") AS date, invoice_count AS invoiceCount, km_awal AS kmAwal, km_akhir AS kmAkhir, total_km AS totalKm FROM daily_reports ORDER BY date DESC'))
  }
  const hasBbmUnique = await query('SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=? AND TABLE_NAME="bbm_records" AND INDEX_NAME="unique_bbm_courier_date"',[process.env.DB_NAME])
  if (!hasBbmUnique[0] || !hasBbmUnique[0].c) {
    await safe(() => query('ALTER TABLE bbm_records ADD UNIQUE KEY unique_bbm_courier_date (courier_id, tanggal)'))
  }
  const hasDelStatusIdx = await query('SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=? AND TABLE_NAME="deliveries" AND INDEX_NAME="idx_deliveries_status"',[process.env.DB_NAME])
  if (!hasDelStatusIdx[0] || !hasDelStatusIdx[0].c) {
    await safe(() => query('ALTER TABLE deliveries ADD INDEX idx_deliveries_status (status)'))
  }
  await safe(() => query('ALTER TABLE users MODIFY role ENUM("admin","messenger","kurir") DEFAULT "messenger"'))
  await safe(() => query('ALTER TABLE deliveries MODIFY status ENUM("On time","Out of Time")'))
  await safe(() => query('ALTER TABLE deliveries MODIFY invoice VARCHAR(100) NOT NULL'))
  await safe(() => query('ALTER TABLE deliveries MODIFY item VARCHAR(255) NOT NULL'))
  await safe(() => query('ALTER TABLE deliveries MODIFY sent_date DATE NOT NULL'))
  await safe(() => query('ALTER TABLE deliveries MODIFY messenger VARCHAR(255) NOT NULL'))
  const trigBbmIns2 = await query('SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.TRIGGERS WHERE TRIGGER_SCHEMA=? AND TRIGGER_NAME="calculate_bbm_total_km"',[process.env.DB_NAME])
  if (trigBbmIns2[0] && trigBbmIns2[0].c) {
    await safe(() => query('DROP TRIGGER calculate_bbm_total_km'))
  }
  await safe(() => query('CREATE TRIGGER calculate_bbm_total_km BEFORE INSERT ON bbm_records FOR EACH ROW BEGIN DECLARE v_price DECIMAL(12,2); DECLARE v_kpl DECIMAL(12,2); SELECT fuel_price, km_per_liter INTO v_price, v_kpl FROM settings ORDER BY id ASC LIMIT 1; SET v_price = IFNULL(v_price, 10000); SET v_kpl = IFNULL(v_kpl, 35); SET NEW.total_kilometer = CAST(IFNULL(NEW.kilometer_akhir,0) AS UNSIGNED) - CAST(IFNULL(NEW.kilometer_awal,0) AS UNSIGNED); SET NEW.jumlah_bbm_rupiah = (IFNULL(NEW.total_kilometer,0) / v_kpl) * v_price; END'))
  const trigBbmUpd2 = await query('SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.TRIGGERS WHERE TRIGGER_SCHEMA=? AND TRIGGER_NAME="update_bbm_total_km"',[process.env.DB_NAME])
  if (trigBbmUpd2[0] && trigBbmUpd2[0].c) {
    await safe(() => query('DROP TRIGGER update_bbm_total_km'))
  }
  await safe(() => query('CREATE TRIGGER update_bbm_total_km BEFORE UPDATE ON bbm_records FOR EACH ROW BEGIN DECLARE v_price DECIMAL(12,2); DECLARE v_kpl DECIMAL(12,2); SELECT fuel_price, km_per_liter INTO v_price, v_kpl FROM settings ORDER BY id ASC LIMIT 1; SET v_price = IFNULL(v_price, 10000); SET v_kpl = IFNULL(v_kpl, 35); SET NEW.total_kilometer = CAST(IFNULL(NEW.kilometer_akhir,0) AS UNSIGNED) - CAST(IFNULL(NEW.kilometer_awal,0) AS UNSIGNED); SET NEW.jumlah_bbm_rupiah = (IFNULL(NEW.total_kilometer,0) / v_kpl) * v_price; END'))
  const trigDelNamesIns = await query('SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.TRIGGERS WHERE TRIGGER_SCHEMA=? AND TRIGGER_NAME="sync_deliveries_names_ins"',[process.env.DB_NAME])
  if (trigDelNamesIns[0] && trigDelNamesIns[0].c) {
    await safe(() => query('DROP TRIGGER sync_deliveries_names_ins'))
  }
  await safe(() => query('CREATE TRIGGER sync_deliveries_names_ins BEFORE INSERT ON deliveries FOR EACH ROW BEGIN IF NEW.customer_id IS NOT NULL THEN SET NEW.customer = (SELECT nama_customer FROM customers WHERE id = NEW.customer_id LIMIT 1); END IF; IF NEW.courier_id IS NOT NULL THEN SET NEW.messenger = (SELECT name FROM users WHERE id = NEW.courier_id LIMIT 1); END IF; END'))
  const trigDelNamesUpd = await query('SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.TRIGGERS WHERE TRIGGER_SCHEMA=? AND TRIGGER_NAME="sync_deliveries_names_upd"',[process.env.DB_NAME])
  if (trigDelNamesUpd[0] && trigDelNamesUpd[0].c) {
    await safe(() => query('DROP TRIGGER sync_deliveries_names_upd'))
  }
  await safe(() => query('CREATE TRIGGER sync_deliveries_names_upd BEFORE UPDATE ON deliveries FOR EACH ROW BEGIN IF NEW.customer_id IS NOT NULL THEN SET NEW.customer = (SELECT nama_customer FROM customers WHERE id = NEW.customer_id LIMIT 1); END IF; IF NEW.courier_id IS NOT NULL THEN SET NEW.messenger = (SELECT name FROM users WHERE id = NEW.courier_id LIMIT 1); END IF; END'))
  await safe(() => query('DROP TABLE IF EXISTS user'))
  await safe(() => query('DROP TABLE IF EXISTS customer'))
  await safe(() => query('DROP TABLE IF EXISTS deliverd'))
  await safe(() => query('DROP TABLE IF EXISTS delivered'))
  await safe(() => query('DROP TABLE IF EXISTS bbm'))
  const idx = await query(
    'SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=? AND TABLE_NAME="users" AND INDEX_NAME="uniq_users_email"',
    [process.env.DB_NAME]
  )
  if (!idx[0] || !idx[0].c) {
    await safe(() => query('ALTER TABLE users ADD UNIQUE KEY uniq_users_email (email)'))
  }
}
