const { default: fetch } = require('node-fetch');

const API_URL = 'http://localhost:3000/api';

async function testUserWorkflow() {
  console.log('=== TESTING USER MANAGEMENT WORKFLOW ===\n');
  
  try {
    // 1. Test user creation
    console.log('1. Testing user creation...');
    const createResponse = await fetch(`${API_URL}/users/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        password: 'TestPass123',
        fullname: 'Test User',
        userType: 'Data Entry Officer',
        createdBy: 'admin'
      })
    });
    
    const createData = await createResponse.json();
    console.log('Create result:', createData);
    
    if (!createData.success) {
      console.log('❌ User creation failed (might already exist)');
    } else {
      console.log('✅ User created successfully');
    }
    
    // 2. Test login with new credentials
    console.log('\n2. Testing login with new credentials...');
    const loginResponse = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        password: 'TestPass123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login result:', loginData);
    
    if (loginData.success) {
      console.log('✅ Login successful with new credentials');
      const userId = loginData.user.id;
      
      // 3. Test password update
      console.log('\n3. Testing password update...');
      const updateResponse = await fetch(`${API_URL}/users/${userId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword: 'UpdatedPass456'
        })
      });
      
      const updateData = await updateResponse.json();
      console.log('Password update result:', updateData);
      
      if (updateData.success) {
        console.log('✅ Password updated successfully');
        
        // 4. Test login with updated password
        console.log('\n4. Testing login with updated password...');
        const loginNewResponse = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'testuser',
            password: 'UpdatedPass456'
          })
        });
        
        const loginNewData = await loginNewResponse.json();
        console.log('Login with new password result:', loginNewData);
        
        if (loginNewData.success) {
          console.log('✅ Login successful with updated password');
        } else {
          console.log('❌ Login failed with updated password');
        }
        
        // Test login with old password (should fail)
        console.log('\n5. Testing login with old password (should fail)...');
        const loginOldResponse = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'testuser',
            password: 'TestPass123'
          })
        });
        
        const loginOldData = await loginOldResponse.json();
        console.log('Login with old password result:', loginOldData);
        
        if (!loginOldData.success) {
          console.log('✅ Old password correctly rejected');
        } else {
          console.log('❌ Old password incorrectly accepted');
        }
        
        // 6. Clean up - delete test user
        console.log('\n6. Cleaning up test user...');
        const deleteResponse = await fetch(`${API_URL}/users/${userId}`, {
          method: 'DELETE'
        });
        
        const deleteData = await deleteResponse.json();
        if (deleteData.success) {
          console.log('✅ Test user cleaned up successfully');
        }
        
      } else {
        console.log('❌ Password update failed');
      }
    } else {
      console.log('❌ Login failed with new credentials');
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
  
  console.log('\n=== TEST COMPLETE ===');
}

// Run the test
testUserWorkflow();