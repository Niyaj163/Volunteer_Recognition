import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { admin, db, FieldValue } from './firebase.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Seeding Admin & Default Configuration
async function seedDatabase() {
  try {
    if (!db) {
      console.warn('Firestore database is not initialized. Skipping database seeding.');
      return;
    }
    // Seed default settings (secret code) if not exists
    const settingsRef = db.collection('settings').doc('system');
    const settingsDoc = await settingsRef.get();
    if (!settingsDoc.exists) {
      await settingsRef.set({
        executiveSecretCode: 'RUET2026',
        updatedAt: new Date()
      });
      console.log('Seeded default executive secret code: RUET2026');
    }

    // Seed default admin if not exists
    const adminId = '0123456';
    const adminRef = db.collection('users').doc(adminId);
    const adminDoc = await adminRef.get();
    if (!adminDoc.exists) {
      await adminRef.set({
        id: adminId,
        name: 'RUET Computing Society',
        role: 'admin',
        points: 0,
        createdAt: new Date()
      });
      console.log('Seeded default admin account: RUET Computing Society (0123456)');
    }
  } catch (error) {
    console.error('Error during database seeding:', error);
  }
}

// Initialize seed
seedDatabase();

// --- API ROUTES ---

// 1. Register User
app.post('/api/auth/register', async (req, res) => {
  const { name, id, role, secretCode } = req.body;

  if (!name || !id || !role) {
    return res.status(400).json({ error: 'Name, Student ID, and Role are required.' });
  }

  // Validate 7-digit ID
  if (!/^\d{7}$/.test(id)) {
    return res.status(400).json({ error: 'Student ID must be exactly a 7-digit number.' });
  }

  if (role !== 'volunteer' && role !== 'executive') {
    return res.status(400).json({ error: 'Invalid role specified.' });
  }

  try {
    if (!db) {
      return res.status(500).json({ error: 'Database connection is not configured.' });
    }

    // Check if user already exists
    const userRef = db.collection('users').doc(id);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      return res.status(400).json({ error: 'An account with this Student ID already exists.' });
    }

    // Additional check for executive members
    if (role === 'executive') {
      const settingsDoc = await db.collection('settings').doc('system').get();
      const currentSecretCode = settingsDoc.exists ? settingsDoc.data().executiveSecretCode : 'RUET2026';
      
      if (secretCode !== currentSecretCode) {
        return res.status(400).json({ error: 'Incorrect Executive Secret Code.' });
      }
    }

    const userData = {
      id,
      name: name.trim(),
      role,
      points: 0,
      createdAt: new Date()
    };

    await userRef.set(userData);
    res.status(201).json({ message: 'Registration successful', user: userData });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Login User
app.post('/api/auth/login', async (req, res) => {
  const { name, id } = req.body;

  if (!name || !id) {
    return res.status(400).json({ error: 'Name and Student ID are required.' });
  }

  try {
    if (!db) {
      return res.status(500).json({ error: 'Database connection is not configured.' });
    }

    // Fetch user by ID
    const userRef = db.collection('users').doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found. Please register first.' });
    }

    const userData = userDoc.data();

    // Verify name matches (case-insensitive and trimmed)
    if (userData.name.toLowerCase().trim() !== name.toLowerCase().trim()) {
      return res.status(400).json({ error: 'Incorrect name or Student ID.' });
    }

    res.json({ message: 'Login successful', user: userData });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Get Volunteers List (Top 20 or All)
app.get('/api/volunteers', async (req, res) => {
  const { all } = req.query;

  try {
    if (!db) {
      return res.status(500).json({ error: 'Database connection is not configured.' });
    }

    const queryRef = db.collection('users')
      .where('role', '==', 'volunteer');

    const snapshot = await queryRef.get();
    let volunteers = [];
    snapshot.forEach(doc => {
      volunteers.push(doc.data());
    });

    // Sort in memory by points descending
    volunteers.sort((a, b) => (b.points || 0) - (a.points || 0));

    // Limit to top 20 if all is not true
    if (all !== 'true') {
      volunteers = volunteers.slice(0, 20);
    }

    res.json({ volunteers });
  } catch (error) {
    console.error('Get volunteers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Search Volunteers (by Name or ID)
app.get('/api/volunteers/search', async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Search query is required.' });
  }

  try {
    if (!db) {
      return res.status(500).json({ error: 'Database connection is not configured.' });
    }

    // To perform flexible search, fetch all volunteers and filter
    const snapshot = await db.collection('users').where('role', '==', 'volunteer').get();
    const volunteers = [];
    
    snapshot.forEach(doc => {
      volunteers.push(doc.data());
    });

    const searchQuery = query.toLowerCase().trim();
    const filteredVolunteers = volunteers.filter(volunteer => 
      volunteer.id.includes(searchQuery) || 
      volunteer.name.toLowerCase().includes(searchQuery)
    );

    // Sort matching volunteers by points descending
    filteredVolunteers.sort((a, b) => b.points - a.points);

    res.json({ volunteers: filteredVolunteers });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. Add Recognition (Executives Only)
app.post('/api/recognitions', async (req, res) => {
  const { workDescription, recipients, executiveId } = req.body;

  if (!workDescription || !recipients || !Array.isArray(recipients) || recipients.length === 0 || !executiveId) {
    return res.status(400).json({ error: 'Work description, recipients list, and Executive ID are required.' });
  }

  try {
    if (!db) {
      return res.status(500).json({ error: 'Database connection is not configured.' });
    }

    // Verify sender is an Executive Member
    const execDoc = await db.collection('users').doc(executiveId).get();
    if (!execDoc.exists || execDoc.data().role !== 'executive') {
      return res.status(403).json({ error: 'Access denied. Only Executive Members can log recognitions.' });
    }

    const batch = db.batch();

    // Increment points for each recipient
    for (const recipientId of recipients) {
      const userRef = db.collection('users').doc(recipientId);
      const userDoc = await userRef.get();
      
      if (userDoc.exists && userDoc.data().role === 'volunteer') {
        batch.update(userRef, {
          points: FieldValue.increment(1)
        });
      } else {
        console.warn(`Attempted to increment points for non-existent or non-volunteer user: ${recipientId}`);
      }
    }

    // Log the recognition event
    const recognitionRef = db.collection('recognitions').doc();
    batch.set(recognitionRef, {
      id: recognitionRef.id,
      workDescription: workDescription.trim(),
      awardedBy: executiveId,
      recipients,
      timestamp: new Date()
    });

    await batch.commit();

    res.status(201).json({ message: 'Recognition submitted successfully. Points updated.' });
  } catch (error) {
    console.error('Add recognition error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 6. Get Executive Secret Code (Admin Only)
app.get('/api/admin/secret-code', async (req, res) => {
  const { adminId } = req.query;

  if (!adminId) {
    return res.status(400).json({ error: 'Admin ID is required.' });
  }

  try {
    if (!db) {
      return res.status(500).json({ error: 'Database connection is not configured.' });
    }

    const adminDoc = await db.collection('users').doc(adminId).get();
    if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    const settingsDoc = await db.collection('settings').doc('system').get();
    const secretCode = settingsDoc.exists ? settingsDoc.data().executiveSecretCode : 'RUET2026';

    res.json({ secretCode });
  } catch (error) {
    console.error('Get secret code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 7. Update Executive Secret Code (Admin Only)
app.post('/api/admin/secret-code', async (req, res) => {
  const { secretCode, adminId } = req.body;

  if (!secretCode || !adminId) {
    return res.status(400).json({ error: 'Secret code and Admin ID are required.' });
  }

  try {
    if (!db) {
      return res.status(500).json({ error: 'Database connection is not configured.' });
    }

    const adminDoc = await db.collection('users').doc(adminId).get();
    if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    await db.collection('settings').doc('system').update({
      executiveSecretCode: secretCode.trim(),
      updatedAt: new Date()
    });

    res.json({ message: 'Secret code updated successfully.' });
  } catch (error) {
    console.error('Update secret code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Start the Server ---
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
