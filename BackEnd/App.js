const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',       // Update if needed
  database: 'surveyDB'
});

// Check database connection
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log('Connected to the MySQL database.');
  }
});

app.post('/api/surveys', (req, res) => {
  let { fullname, email, dateofBirth, rate, foodCategory, hobbiesCategory } = req.body;

  // ✅ Calculate age from dateOfBirth
  const birthDate = new Date(dateofBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasHadBirthdayThisYear = today.getMonth() > birthDate.getMonth() || 
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  const sql = `INSERT INTO surveys (fullname, email, age, dateofBirth, rate, foodCategory, hobbiesCategory)
               VALUES (?, ?, ?, ?, ?, ?, ?)`;

  const values = [fullname, email, age, dateofBirth, rate, foodCategory, hobbiesCategory];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting data:', err);
      res.status(500).json({ message: 'Failed to insert data' });
    } else {
      res.status(201).json({ message: 'Survey submitted successfully', id: result.insertId });
    }
  });
});


app.listen(3000, () => {
    console.log('Server running on port 3000');
});