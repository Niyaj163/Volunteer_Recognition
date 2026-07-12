// Using global fetch (native in Node.js v18+)

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING BACKEND ENDPOINT TESTS ---');
  console.log(`Targeting backend server at: ${BASE_URL}`);
  console.log('NOTE: Ensure the backend server is running ("npm run dev" inside backend) before running this script.\n');

  try {
    // Test 1: Register a Volunteer
    console.log('Test 1: Registering a volunteer...');
    const regVolResponse = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Volunteer',
        id: '2000001',
        role: 'volunteer'
      })
    });
    const regVolData = await regVolResponse.json();
    console.log(`Response Status: ${regVolResponse.status}`);
    console.log(`Response Body:`, regVolData);
    console.log('------------------------------------');

    // Test 2: Register an Executive with WRONG secret code
    console.log('Test 2: Registering an executive with WRONG secret code (should fail)...');
    const regExecFailResponse = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Executive Fail',
        id: '2000002',
        role: 'executive',
        secretCode: 'WRONG_CODE'
      })
    });
    const regExecFailData = await regExecFailResponse.json();
    console.log(`Response Status: ${regExecFailResponse.status}`);
    console.log(`Response Body:`, regExecFailData);
    console.log('------------------------------------');

    // Test 3: Register an Executive with CORRECT secret code
    console.log('Test 3: Registering an executive with CORRECT secret code...');
    const regExecPassResponse = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Executive Pass',
        id: '2000003',
        role: 'executive',
        secretCode: 'RUET2026' // default seeded secret code
      })
    });
    const regExecPassData = await regExecPassResponse.json();
    console.log(`Response Status: ${regExecPassResponse.status}`);
    console.log(`Response Body:`, regExecPassData);
    console.log('------------------------------------');

    // Test 4: Log in as Admin (RUET Computing Society / 0123456)
    console.log('Test 4: Logging in as pre-seeded Admin...');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'RUET Computing Society',
        id: '0123456'
      })
    });
    const adminLoginData = await adminLoginRes.json();
    console.log(`Response Status: ${adminLoginRes.status}`);
    console.log(`Response Body:`, adminLoginData);
    console.log('------------------------------------');

    // Test 5: Log in as the Volunteer
    console.log('Test 5: Logging in as the registered Volunteer...');
    const volLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Volunteer',
        id: '2000001'
      })
    });
    const volLoginData = await volLoginRes.json();
    console.log(`Response Status: ${volLoginRes.status}`);
    console.log(`Response Body:`, volLoginData);
    console.log('------------------------------------');

    // Test 6: Fetch Volunteers list
    console.log('Test 6: Fetching volunteers list...');
    const volListRes = await fetch(`${BASE_URL}/volunteers`);
    const volListData = await volListRes.json();
    console.log(`Response Status: ${volListRes.status}`);
    console.log(`Response Body: Found ${volListData.volunteers?.length || 0} volunteers.`);
    console.log('------------------------------------');

    // Test 7: Add Recognition (Award 1 point to volunteer)
    console.log('Test 7: Awarding point via Executive Recognition...');
    const recogRes = await fetch(`${BASE_URL}/recognitions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workDescription: 'Successfully organized CSE Fest 2026',
        recipients: ['2000001'],
        executiveId: '2000003' // from Test 3
      })
    });
    const recogData = await recogRes.json();
    console.log(`Response Status: ${recogRes.status}`);
    console.log(`Response Body:`, recogData);
    console.log('------------------------------------');

    // Test 8: Fetch Volunteers list again to verify points updated
    console.log('Test 8: Re-fetching volunteers list to verify point increment...');
    const volListVerifyRes = await fetch(`${BASE_URL}/volunteers`);
    const volListVerifyData = await volListVerifyRes.json();
    console.log(`Response Status: ${volListVerifyRes.status}`);
    const testVol = volListVerifyData.volunteers?.find(v => v.id === '2000001');
    console.log(`Volunteer Points: ${testVol ? testVol.points : 'Not Found'}`);
    console.log('------------------------------------');

    // Test 9: Get Secret Code as Admin
    console.log('Test 9: Reading Secret Code as Admin...');
    const secretCodeRes = await fetch(`${BASE_URL}/admin/secret-code?adminId=0123456`);
    const secretCodeData = await secretCodeRes.json();
    console.log(`Response Status: ${secretCodeRes.status}`);
    console.log(`Response Body:`, secretCodeData);
    console.log('------------------------------------');

    // Test 10: Update Secret Code as Admin
    console.log('Test 10: Changing Secret Code as Admin to "NEW_CODE_999"...');
    const updateCodeRes = await fetch(`${BASE_URL}/admin/secret-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secretCode: 'NEW_CODE_999',
        adminId: '0123456'
      })
    });
    const updateCodeData = await updateCodeRes.json();
    console.log(`Response Status: ${updateCodeRes.status}`);
    console.log(`Response Body:`, updateCodeData);
    console.log('------------------------------------');

    console.log('--- ALL ENDPOINT TESTS COMPLETED ---');

  } catch (error) {
    console.error('Testing process failed. Is the server running? Details:', error.message);
  }
}

runTests();
