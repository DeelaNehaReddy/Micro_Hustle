require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const admin = require('firebase-admin');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const session = require('express-session');

// Validate required environment variables
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'FIREBASE_SERVICE_ACCOUNT',
  'SESSION_SECRET',
  'STRIPE_PUBLISHABLE_KEY'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`Missing required environment variable: ${varName}`);
    process.exit(1);
  }
});

// Initialize Firebase
const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = admin.firestore();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(cors()); // Add this early in app.js
// Middleware
app.use(limiter);
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.urlencoded({ extended: true, limit: '10kb' }));
app.use(bodyParser.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 86400000 // 1 day
  }
}));
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine
app.set('views', path.join(__dirname, 'public/views'));
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

// ======================
// ROUTES
// ======================

// Home Route
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Authentication Routes
app.get('/login', (req, res) => {
  res.render('login.html');
});

app.get('/signup', (req, res) => {
  res.render('signup.html');
});

// User Registration
app.post('/signup', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Invalid email format' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    // Check for existing user
    const snapshot = await db.collection('users').where('email', '==', email).get();
    if (!snapshot.empty) return res.status(400).json({ error: 'Email already in use' });
    
    // Create new user
    const userDoc = await db.collection('users').add({
      email,
      password: await bcrypt.hash(password, 10),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(201).json({ 
      message: 'User created successfully',
      userId: userDoc.id 
    });
  } catch (error) {
    next(error);
  }
});

// User Login
app.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    // Find user
    const snapshot = await db.collection('users').where('email', '==', email).get();
    if (snapshot.empty) return res.status(401).json({ error: 'Invalid credentials' });
    
    // Verify user
    let userData, userId;
    snapshot.forEach(doc => {
      userData = doc.data();
      userId = doc.id;
    });
    
    if (!await bcrypt.compare(password, userData.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Set session
    req.session.userId = userId;
    res.status(200).json({ 
      message: 'Login successful', 
      redirect: '/dashboard',
      user: { id: userId, email: userData.email }
    });
  } catch (error) {
    next(error);
  }
});

// Dashboard Route
app.get('/dashboard', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.redirect('/login');
    
    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return res.redirect('/login');
    
    // Get user's gigs
    const gigsSnapshot = await db.collection('gigs').where('userId', '==', userId).get();
    const gigs = gigsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.render('dashboard.html', { 
      user: userDoc.data(),
      gigs,
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    });
  } catch (error) {
    next(error);
  }
});

// Browse Gigs Route
app.get('/browse', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/views/browse.html'));
});

// ======================
// GIG MANAGEMENT
// ======================

// Create Gig (with optional payment)
app.post('/api/create-gig', async (req, res, next) => {
  try {
    const { title, description, amount } = req.body;
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    
    // Validation
    if (!title || !amount) return res.status(400).json({ error: 'Title and amount are required' });
    const amountNum = parseInt(amount);
    if (isNaN(amountNum)) return res.status(400).json({ error: 'Amount must be a number' });

    // Create gig document
    const newGig = {
      userId,
      title,
      description: description || '',
      amount: amountNum,
      status: 'open',
      assignedTo: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // For testing: auto-complete payment
    if (process.env.NODE_ENV === 'development') {
      newGig.paymentStatus = 'completed';
      newGig.paymentId = 'test-payment-' + Math.random().toString(36).substring(7);
      const docRef = await db.collection('gigs').add(newGig);
      return res.status(201).json({ id: docRef.id, ...newGig });
    }
    
    // For production: require real payment
    newGig.paymentStatus = 'pending';
    const docRef = await db.collection('gigs').add(newGig);
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountNum * 100,
      currency: "usd",
      metadata: { gigId: docRef.id }
    });
    
    res.status(201).json({ 
      id: docRef.id,
      ...newGig,
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    next(error);
  }
});

// Confirm Payment
app.post('/api/confirm-payment', async (req, res, next) => {
  try {
    const { gigId, paymentId } = req.body;
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Verify gig ownership
    const gigRef = db.collection('gigs').doc(gigId);
    const gig = await gigRef.get();
    if (!gig.exists || gig.data().userId !== userId) {
      return res.status(404).json({ error: 'Gig not found' });
    }

    // Update gig status
    await gigRef.update({
      paymentStatus: 'completed',
      paymentId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get Available Gigs
// In app.js (add this before app.listen())
app.get('/api/gigs', async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('gigs').get();
    const gigs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || "Untitled Gig",
        price: data.amount || 0,  // Your Firestore uses 'amount', not 'price'
        description: data.description || "",
        status: data.paymentsStatus || "pending" // Your field name
      };
    });
    res.json(gigs);
  } catch (err) {
    console.error("Firestore error:", err);
    res.status(500).json({ error: "Failed to load gigs" });
  }
});
// Add this before your /api/apply-gig route
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
      
      const token = authHeader.split(' ')[1];
      req.user = await admin.auth().verifyIdToken(token);
      next();
    } catch (err) {
      console.error("Auth error:", err);
      res.status(401).json({ error: "Invalid token" });
    }
  } else {
    next();
  }
});
// Apply to Gig
app.post('/api/apply-gig', async (req, res) => {
  try {
    const { gigId } = req.body;
    const userId = req.user.uid; // From Firebase auth middleware

    // Verify gig exists
    const gigRef = db.collection('gigs').doc(gigId);
    const gigDoc = await gigRef.get();
    if (!gigDoc.exists) {
      return res.status(404).json({ message: "Gig not found" });
    }

    // Check for existing application
    const existingApp = await db.collection('applications')
      .where('userId', '==', userId)
      .where('gigId', '==', gigId)
      .limit(1)
      .get();

    if (!existingApp.empty) {
      return res.status(409).json({ message: "You've already applied to this gig" });
    }

    // Create application
    await db.collection('applications').add({
      gigId,
      userId,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Application error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Assign Gig to Worker
app.post('/api/assign-gig', async (req, res, next) => {
  try {
    const { gigId, workerId } = req.body;
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Verify gig ownership
    const gigRef = db.collection('gigs').doc(gigId);
    const gig = await gigRef.get();
    if (!gig.exists || gig.data().userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Verify worker exists
    const worker = await db.collection('users').doc(workerId).get();
    if (!worker.exists) return res.status(404).json({ error: 'Worker not found' });

    // Update gig status
    await gigRef.update({
      status: 'assigned',
      assignedTo: workerId,
      assignedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create notification
    await db.collection('notifications').add({
      userId: workerId,
      message: `You've been assigned to gig: ${gig.data().title}`,
      gigId,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});
// In your route handler (e.g., app.js)
app.get('/api/gigs', async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('gigs').get();
    const gigs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || "Untitled Gig",
        description: data.description || "",
        amount: data.amount || 0, // Default to 0 if missing
        status: data.status || "active"
      };
    });
    res.json(gigs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Get Worker's Assigned Gigs
app.get('/api/worker-gigs', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const snapshot = await db.collection('gigs')
      .where('assignedTo', '==', userId)
      .get();
    
    res.json(snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      displayAmount: (doc.data().amount / 100).toFixed(2)
    })));
  } catch (error) {
    next(error);
  }
});

// ======================
// UTILITY ROUTES
// ======================

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.error('Logout error:', err);
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});