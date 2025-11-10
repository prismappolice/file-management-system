const http = require('http');

// Test the serve endpoint
const testEndpoint = (fileId) => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/serve/${fileId}`,
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`\nTesting /api/serve/${fileId}:`);
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log(`Success! File served correctly.`);
        console.log(`Content (first 100 chars): ${data.substring(0, 100)}`);
      } else {
        console.log(`Error: ${data}`);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Request error: ${e.message}`);
  });

  req.end();
};

// Test with our test file (ID 32)
testEndpoint(32);

// Test with the problematic file (ID 31)
setTimeout(() => testEndpoint(31), 1000);