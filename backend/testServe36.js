const http = require('http');

// Test the serve endpoint for file ID 36
const testServeEndpoint = (fileId) => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/serve/${fileId}`,
    method: 'GET'
  };

  console.log(`Testing GET /api/serve/${fileId}`);

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log(`✅ Success! File served correctly.`);
        if (data.length < 200) {
          console.log(`Response data: ${data}`);
        } else {
          console.log(`Response data length: ${data.length} bytes`);
        }
      } else {
        console.log(`❌ Error ${res.statusCode}: ${data}`);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`❌ Request error: ${e.message}`);
  });

  req.end();
};

// Test file ID 36
testServeEndpoint(36);