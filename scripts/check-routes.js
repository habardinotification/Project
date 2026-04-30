const fs = require('fs');
const path = require('path');

const root = process.cwd();
const viewsDir = path.join(root, 'views');

const requiredViews = [
  'blocks.ejs',
  'cash_orders.ejs',
  'contact.ejs',
  'custom_page.ejs',
  'dashboard.ejs',
  'distribution-quality.ejs',
  'distribution.ejs',
  'drivers.ejs',
  'expenses.ejs',
  'factories.ejs',
  'factory_orders.ejs',
  'layout.ejs',
  'login.ejs',
  'logs.ejs',
  'materials.ejs',
  'not_found.ejs',
  'orders.ejs',
  'pages.ejs',
  'reports.ejs',
  'scale_report.ejs',
  'settings.ejs',
  'trucks-failed-report.ejs',
  'trucks-failed.ejs',
  'trucks.ejs',
  'users.ejs'
];

console.log('Project root:', root);
console.log('Views folder:', viewsDir);
console.log('');

let ok = true;

for (const file of requiredViews) {
  const fullPath = path.join(viewsDir, file);

  if (fs.existsSync(fullPath)) {
    console.log('OK   views/' + file);
  } else {
    console.log('MISS views/' + file);
    ok = false;
  }
}

console.log('');

if (ok) {
  console.log('All listed views exist.');
} else {
  console.log('Some views are missing.');
  process.exitCode = 1;
}
