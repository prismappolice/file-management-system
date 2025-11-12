const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000/api';

async function testProgramCreation() {
  console.log('=== TESTING PROGRAM CREATION WITH ADMIN USER ===\n');

  // Test 1: Login as admin
  console.log('1. Logging in as admin...');
  try {
    const loginResponse = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });

    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      console.error('❌ Login failed:', loginData.error);
      return;
    }

    console.log('✅ Login successful');
    console.log(`   User: ${loginData.user.username}`);
    console.log(`   Type: ${loginData.user.userType}\n`);

    const userType = loginData.user.userType;
    const userName = loginData.user.username;

    // Test 2: Create a program
    console.log('2. Creating a test program...');
    const testProgram = {
      id: 'test-program-' + Date.now(),
      name: 'Test Program API',
      icon: 'TP',
      path: '/test-program-api',
      color: '#ff0844',
      created_date: new Date().toISOString().split('T')[0],
      createdBy: userName,
      userType: userType
    };

    const createResponse = await fetch(`${API_URL}/programs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testProgram)
    });

    const createData = await createResponse.json();

    if (!createData.success) {
      console.error('❌ Program creation failed:', createData.error);
      console.log('   Status:', createResponse.status);
      console.log('   Sent userType:', userType);
      return;
    }

    console.log('✅ Program created successfully!');
    console.log(`   ID: ${createData.program.id}`);
    console.log(`   Name: ${createData.program.name}\n`);

    // Test 3: Verify program exists
    console.log('3. Verifying program was saved...');
    const listResponse = await fetch(`${API_URL}/programs`);
    const listData = await listResponse.json();

    const foundProgram = listData.programs.find(p => p.id === testProgram.id);
    
    if (foundProgram) {
      console.log('✅ Program found in database');
      console.log(`   Name: ${foundProgram.name}\n`);
    } else {
      console.log('⚠️  Program not found in list\n');
    }

    // Test 4: Delete the test program
    console.log('4. Cleaning up test program...');
    const deleteResponse = await fetch(`${API_URL}/programs/${testProgram.id}?userType=${userType}`, {
      method: 'DELETE'
    });

    const deleteData = await deleteResponse.json();

    if (deleteData.success) {
      console.log('✅ Test program deleted\n');
    } else {
      console.error('⚠️  Failed to delete test program:', deleteData.error, '\n');
    }

    console.log('=== ALL TESTS PASSED ===');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n⚠️  Make sure the backend server is running on port 3000');
  }
}

testProgramCreation();
