const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ //returns boolean
  // A simple validation: username must be a non-empty string
  return typeof username === 'string' && username.trim().length > 0;
}

const authenticatedUser = (username,password)=>{ //returns boolean
  // Check if username and password match one of the registered users
  return users.some(u => u.username === username && u.password === password);
}

//only registered users can login
regd_users.post("/login", (req,res) => {
  const { username, password } = req.body || {};

  // Validate input
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  // Authenticate user
  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  // Create JWT and save to session
  const token = jwt.sign({ username: username }, 'access', { expiresIn: 60 * 60 });

  // Ensure session object exists and store token/user
  if (req.session) {
    req.session.accessToken = token;
    req.session.user = { username };
  }

  return res.status(200).json({ message: 'User successfully logged in' });
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  // Ensure user is logged in via session
  const username = req.session && req.session.user && req.session.user.username;
  if (!username) {
    return res.status(401).json({ message: 'User not logged in' });
  }

  const isbn = req.params.isbn;
  if (!isbn) {
    return res.status(400).json({ message: 'ISBN is required' });
  }

  const book = books[isbn];
  if (!book) {
    return res.status(404).json({ message: 'Book not found' });
  }

  // Review is provided as a query parameter, e.g. ?review=Great
  const review = req.query.review;
  if (!review) {
    return res.status(400).json({ message: 'Review is required as query parameter' });
  }

  if (!book.reviews) book.reviews = {};

  // Add or update the review for this user
  book.reviews[username] = review;

  return res.status(200).json({ message: 'Review added/updated successfully', reviews: book.reviews });
});

// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
  // Ensure user is logged in via session
  const username = req.session && req.session.user && req.session.user.username;
  if (!username) {
    return res.status(401).json({ message: 'User not logged in' });
  }

  const isbn = req.params.isbn;
  if (!isbn) {
    return res.status(400).json({ message: 'ISBN is required' });
  }

  const book = books[isbn];
  if (!book) {
    return res.status(404).json({ message: 'Book not found' });
  }

  if (!book.reviews || !Object.prototype.hasOwnProperty.call(book.reviews, username)) {
    return res.status(404).json({ message: 'Review not found for this user' });
  }

  // Delete only the review belonging to the logged-in user
  delete book.reviews[username];

  return res.status(200).json({ message: 'Review deleted successfully', reviews: book.reviews });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
