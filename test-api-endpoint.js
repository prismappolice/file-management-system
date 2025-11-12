const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('Testing API endpoint: http://localhost:3000/api/files\n');
    
    // Test 1: Get all files (admin view - should return all files)
    const response = await fetch('http://localhost:3000/api/files?program=montha-cyclone&userType=ADMIN&userName=admin');
    const data = await response.json();
    
    console.log('API Response Status:', response.status);
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    if (data.success && data.files && data.files.length > 0) {
      console.log('\n=== FILE DATA ANALYSIS ===');
      data.files.forEach((file, index) => {
        console.log(`\nFile ${index + 1}:`);
        console.log('  ID:', file.id);
        console.log('  File No:', `"${file.fileNo}"`);
        console.log('  File No type:', typeof file.fileNo);
        console.log('  File No is undefined:', file.fileNo === undefined);
        console.log('  File No is null:', file.fileNo === null);
        console.log('  File No is empty string:', file.fileNo === '');
        console.log('  Subject:', file.subject);
        console.log('  Department:', file.department);
        console.log('  Filename:', file.filename);
        console.log('  Program:', file.program);
        console.log('  Created by:', file.created_by);
      });
    }
    
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

testAPI();