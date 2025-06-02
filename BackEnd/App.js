const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const port = 3000;

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

app.get('/api/survey-results', (req, res) => {
  db.query('SELECT * FROM survey', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length === 0) {
      return res.json({ message: 'No Surveys Available' });
    }

    const total = results.length;
    const ages = results.map(r => r.age);
    const avgAge = (ages.reduce((a, b) => a + b, 0) / total).toFixed(1);
    const maxAge = Math.max(...ages);
    const minAge = Math.min(...ages);

    let pizzaCount = 0;
    results.forEach(row => {
      const food = JSON.parse(row.favourite_food || '[]');
      if (food.includes('Pizza')) pizzaCount++;
    });

    const pizzaPercentage = ((pizzaCount / total) * 100).toFixed(1);

    const eatOutAvg = (
      results.reduce((sum, r) => sum + r.eat_out_rating, 0) / total
    ).toFixed(1);

    res.json({
      totalSurveys: total,
      avgAge,
      maxAge,
      minAge,
      pizzaPercentage,
      eatOutAvg
    });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
