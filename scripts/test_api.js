const http = require('http');

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch (e) {}
        resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed, rawBody: data });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

function parseJwtClaimNames(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return [];
  const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
  const payload = JSON.parse(payloadJson);
  return Object.keys(payload);
}

async function run() {
  console.log("Waiting 5s for backend to initialize...");
  await new Promise(r => setTimeout(r, 5000));

  const ts = Date.now();
  const hrEmail = `hr.north.${ts}@empowerly.test`;
  const empEmail = `emp.south.${ts}@empowerly.test`;

  // 1. Login as Admin
  console.log("\n--- STEP 1: Login as Admin ---");
  const loginRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@empowerly.test', password: 'Admin@123' });

  console.log(`Admin Login Status Code: ${loginRes.statusCode}`);
  const adminToken = loginRes.body.token;
  const claimNames = parseJwtClaimNames(adminToken);
  console.log(`JWT Token Claim Names: [ ${claimNames.join(', ')} ]`);

  // 2. GET /api/users with no token
  console.log("\n--- STEP 2: GET /api/users with NO token ---");
  const noAuthRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/users',
    method: 'GET'
  });
  console.log(`GET /api/users (no token) Status Code: ${noAuthRes.statusCode} (Expected 401)`);

  // 3. Fetch branches to get branch IDs
  const branchesRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/branches',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const branches = branchesRes.body;
  const northBranch = branches.find(b => b.name === 'North Branch') || branches[1];
  const southBranch = branches.find(b => b.name === 'South Branch') || branches[2];

  // Create HR user in North Branch
  console.log("\n--- STEP 3: Create HR User in North Branch & Employee in South Branch ---");
  const createHrRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/users',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  }, {
    name: 'North HR User',
    email: hrEmail,
    password: 'Password@123',
    role: 'HR',
    branchId: northBranch.id,
    department: 'HR Ops'
  });
  console.log(`Create HR User Status Code: ${createHrRes.statusCode}, User ID: ${createHrRes.body.id}`);

  // Create Employee in South Branch
  const createEmpRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/users',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  }, {
    name: 'South Employee User',
    email: empEmail,
    password: 'Password@123',
    role: 'EMPLOYEE',
    branchId: southBranch.id,
    department: 'Engineering'
  });
  console.log(`Create Employee Status Code: ${createEmpRes.statusCode}, User ID: ${createEmpRes.body.id}`);

  // 4. Log in as North HR user and try to read South Employee User (other branch)
  console.log("\n--- STEP 4: HR user reading user from another branch ---");
  const hrLoginRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: hrEmail, password: 'Password@123' });
  const hrToken = hrLoginRes.body.token;

  const hrReadOtherRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: `/api/users/${createEmpRes.body.id}`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${hrToken}` }
  });
  console.log(`HR read user from another branch Status Code: ${hrReadOtherRes.statusCode} (Expected 403)`);

  // 5. Log in as Employee and try to list users
  console.log("\n--- STEP 5: EMPLOYEE listing all users ---");
  const empLoginRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: empEmail, password: 'Password@123' });
  const empToken = empLoginRes.body.token;

  const empListRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/users',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${empToken}` }
  });
  console.log(`EMPLOYEE GET /api/users Status Code: ${empListRes.statusCode} (Expected 403)`);

  console.log("\n=== ALL VERIFICATION STEPS COMPLETED ===");
}

run().catch(err => {
  console.error("API test error:", err);
  process.exit(1);
});
