// Simple authentication service for demo purposes
// In production, use a proper backend authentication system

import logger from '../utils/logger';

const STORAGE_KEY = 'task_mgmt_users';

// Simple password hashing (for demo only - use proper hashing in production)
const hashPassword = (password) => {
  // This is a simple hash for demo purposes only
  // In production, use bcrypt or similar
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
};

// Get all users from localStorage
const getUsers = () => {
  try {
    const users = localStorage.getItem(STORAGE_KEY);
    return users ? JSON.parse(users) : {};
  } catch (error) {
    logger.error('Error loading users:', error);
    return {};
  }
};

// Save users to localStorage
const saveUsers = (users) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    logger.error('Error saving users:', error);
  }
};

// Register a new user
export const registerUser = async (userData) => {
  const { name, email, password, distinctId } = userData;
  
  // Validate input
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Please enter a valid email address');
  }
  
  const users = getUsers();
  const userId = distinctId || email;
  
  // Check if user already exists
  if (users[userId]) {
    throw new Error('User already exists with this email or ID');
  }
  
  // Create new user
  const passwordHash = hashPassword(password);
  
  const newUser = {
    id: userId,
    name: name || null, // Store null if name is not provided
    email,
    passwordHash: passwordHash,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  users[userId] = newUser;
  saveUsers(users);
  
  return {
    id: newUser.id,
    name: newUser.name || null,
    email: newUser.email,
    createdAt: newUser.createdAt
  };
};

// Authenticate user
export const authenticateUser = async (identifier, password) => {
  if (!identifier || !password) {
    throw new Error('Email/ID and password are required');
  }
  
  const users = getUsers();
  const user = users[identifier];
  
  if (!user) {
    throw new Error('Invalid email/ID or password');
  }
  
  const passwordHash = hashPassword(password);
  if (user.passwordHash !== passwordHash) {
    throw new Error('Invalid email/ID or password');
  }
  
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt
  };
};