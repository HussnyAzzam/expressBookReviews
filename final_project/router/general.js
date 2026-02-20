const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();
const axios = require('axios');

public_users.post("/register", (req,res) => {
  const { username, password } = req.body || {};

  // Validate input
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  // Check if username already exists
  const userExists = users.some(u => u.username === username);
  if (userExists) {
    return res.status(409).json({ message: 'Username already exists' });
  }

  // Register new user
  users.push({ username, password });
  return res.status(201).json({ message: 'User successfully registered' });
});

// Get the book list available in the shop
public_users.get('/',function (req, res) {
  // Return the full books list as nicely formatted JSON
  res.status(200).send(JSON.stringify(books, null, 4));
});

// Get the book list available in the shop (using async/await + Axios)
public_users.get('/books', async function (req, res) {
  try {
    // Call the existing public endpoint on this server to retrieve books
    const response = await axios.get('http://localhost:5000/');
    // response.data already contains the books object
    return res.status(200).send(JSON.stringify(response.data, null, 4));
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching books', error: error.message });
  }
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn',function (req, res) {
  // Retrieve ISBN from route parameters
  const isbn = req.params.isbn;
  if (!isbn) {
    return res.status(400).json({ message: 'ISBN is required' });
  }

  const book = books[isbn];
  if (book) {
    // Return the book details as prettified JSON
    return res.status(200).send(JSON.stringify(book, null, 4));
  }

  // Book not found
  return res.status(404).json({ message: 'Book not found' });
});

// Get book details based on ISBN (using async/await + Axios)
public_users.get('/isbn-async/:isbn', async function (req, res) {
  const isbn = req.params.isbn;
  if (!isbn) {
    return res.status(400).json({ message: 'ISBN is required' });
  }

  try {
    const response = await axios.get(`http://localhost:5000/isbn/${encodeURIComponent(isbn)}`);
    return res.status(200).send(JSON.stringify(response.data, null, 4));
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ message: 'Book not found' });
    }
    return res.status(500).json({ message: 'Error fetching book by ISBN', error: error.message });
  }
});
  
// Get book details based on author
public_users.get('/author/:author',function (req, res) {
  const author = req.params.author;
  if (!author) {
    return res.status(400).json({ message: 'Author is required' });
  }

  const keys = Object.keys(books);
  const matched = [];

  for (let isbn of keys) {
    const book = books[isbn];
    if (book && book.author === author) {
      // include ISBN in the returned object for clarity
      matched.push(Object.assign({ isbn }, book));
    }
  }

  if (matched.length > 0) {
    return res.status(200).send(JSON.stringify(matched, null, 4));
  }

  return res.status(404).json({ message: 'No books found by that author' });
});

// Get all books based on title
public_users.get('/title/:title',function (req, res) {
  const title = req.params.title;
  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  const keys = Object.keys(books);
  const matched = [];

  for (let isbn of keys) {
    const book = books[isbn];
    if (book && book.title === title) {
      matched.push(Object.assign({ isbn }, book));
    }
  }

  if (matched.length > 0) {
    return res.status(200).send(JSON.stringify(matched, null, 4));
  }

  return res.status(404).json({ message: 'No books found with that title' });
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  const isbn = req.params.isbn;
  if (!isbn) {
    return res.status(400).json({ message: 'ISBN is required' });
  }

  const book = books[isbn];
  if (!book) {
    return res.status(404).json({ message: 'Book not found' });
  }

  // Return the reviews object (may be empty) as prettified JSON
  return res.status(200).send(JSON.stringify(book.reviews || {}, null, 4));
});

module.exports.general = public_users;
