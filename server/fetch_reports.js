const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAzODQ0NzNmLWZjYzEtNGM4Zi05YmNmLTk2YTA5MWE5ODYxMyIsImVtYWlsIjoiYWRtaW5AY2FtcHVzbm90ZXMuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzc0Mjg1MzczLCJleHAiOjE3NzQzNzE3NzN9.nRR-8CvBONfxGd2UkX88B_rMyujooqLBro_ZRlEHfytM';

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/admin/reports',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response Body:', data);
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
  process.exit(1);
});

req.end();
