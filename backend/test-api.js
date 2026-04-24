import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api';

async function test() {
  try {
    console.log('Logging in...');
    const loginRes = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qid: '24120201', password: 'password123' }) // Trying password123 first
    });
    
    if (!loginRes.ok) {
      console.log('Login failed. Trying registration...');
      // Try qid 3001
    }
    
    const { token } = await loginRes.json();
    console.log('Token received.');

    console.log('Submitting request with participants...');
    const res = await fetch(`${API_URL}/attendance-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        courseSecDept: 'Test Course',
        yearSemester: '2026/2',
        eventName: 'API Test Event',
        eventDate: '2026-05-01',
        eventType: 'Technical',
        roleInEvent: 'Participant',
        reason: 'Testing API storage',
        declarationAccepted: true,
        participants: [
          { name: 'Alice Test', qid: '9991', course: 'CS', year: '1' },
          { name: 'Bob Test', qid: '9992', course: 'CS', year: '2' }
        ]
      })
    });

    const data = await res.json();
    console.log('Response:', data);
  } catch (err) {
    console.error('Test failed:', err);
  }
}

test();
