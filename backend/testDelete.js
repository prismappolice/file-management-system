const http = require('http');

// Test the delete endpoint
const testDelete = (fileId, userName, userType) => {
  const postData = JSON.stringify({ userName, userType });
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/files/${fileId}`,
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`\nTesting DELETE /api/files/${fileId}:`);
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`Response: ${data}`);
    });
  });

  req.on('error', (e) => {
    console.error(`Request error: ${e.message}`);
  });

  req.write(postData);
  req.end();
};

// Test with file ID 33 (recently uploaded) and userName "District User"
console.log('Testing delete with userName: "District User"');
testDelete(33, 'District User', 'district');

// Test with different userName to see the difference
setTimeout(() => {
  console.log('\nTesting delete with userName: "Prism"');
  testDelete(33, 'Prism', 'district');
}, 2000);