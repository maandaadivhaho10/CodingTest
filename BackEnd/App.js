const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');  // Use promise version

const app = express();

app.use(cors());
app.use(express.json());

// Create a connection pool for async/await
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',       // Update if needed
  database: 'surveydb',   // Make sure this matches your schema name (case-sensitive)
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});app.post('/api/survey', async (req, res) => {
  const { fullname, email, dateofBirth, contact, favoriteFoods, ratings } = req.body;

  if (!fullname || !email || !dateofBirth) {
    return res.status(400).json({ error: 'fullname, email and dateofBirth are required' });
  }

  // Validate dateofBirth format
  const birthDate = new Date(dateofBirth);
  if (isNaN(birthDate.getTime())) {
    return res.status(400).json({ error: 'Invalid dateofBirth format' });
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Insert main survey data
    const [surveyResult] = await connection.execute(
      `INSERT INTO surveys (fullname, email, age, dateofBirth, contact) VALUES (?, ?, ?, ?, ?)`,
      [fullname, email, age, dateofBirth, contact]
    );

    const surveyId = surveyResult.insertId;

    // Insert favorite foods if any
    if (Array.isArray(favoriteFoods)) {
      for (const food of favoriteFoods) {
        await connection.execute(
          `INSERT INTO favorite_foods (survey_id, food) VALUES (?, ?)`,
          [surveyId, food]
        );
      }
    }

    // Insert ratings if it's an object (from frontend) convert to entries array
    if (ratings && typeof ratings === 'object' && !Array.isArray(ratings)) {
      for (const [hobby, rating] of Object.entries(ratings)) {
        await connection.execute(
          `INSERT INTO ratings (survey_id, hoobies, rating) VALUES (?, ?, ?)`,
          [surveyId, hobby, rating]
        );
      }
    }

    await connection.commit();

    res.status(201).json({ message: 'Survey saved successfully', surveyId });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('DB Error:', error);
    res.status(500).json({ error: 'Failed to save survey' });
  } finally {
    if (connection) connection.release();
  }
});


app.get('/total-surveys', async (req, res) => {
  try {
    const [rows] = await pool.execute(`SELECT COUNT(*) AS total_surveys FROM surveys`);
    res.json({ total_surveys: rows[0].total_surveys });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching total surveys' });
  }
});


app.get('/api/survey/youngest-age', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT MIN(age) AS youngestAge FROM surveys`);
    res.json({ youngestAge: rows[0].youngestAge });
  } catch (err) {
    console.error('Error fetching youngest age:', err);
    res.status(500).json({ error: 'Failed to retrieve youngest age' });
  }
});

app.get('/api/survey/oldest-age', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT MAX(age) AS oldestAge FROM surveys`);
    res.json({ oldestAge: rows[0].oldestAge });
  } catch (err) {
    console.error('Error fetching oldest age:', err);
    res.status(500).json({ error: 'Failed to retrieve oldest age' });
  }
});

app.get('/api/surveys/average-age', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT AVG(age) AS avgAge FROM surveys');
    
    res.json({ averageAge: parseFloat(rows[0].avgAge).toFixed(2) }); // return rounded average
  } catch (error) {
    console.error('Error fetching average age:', error);
    res.status(500).json({ error: 'Failed to fetch average age' });
  } finally {
    if (connection) connection.release();
  }
});

app.get('/api/surveys/pizza-percentage', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    // Get total surveys count
    const [totalRes] = await connection.query('SELECT COUNT(*) AS totalSurveys FROM surveys');
    const totalSurveys = totalRes[0].totalSurveys;

    if (totalSurveys === 0) {
      return res.json({ pizzaPercentage: 0 });
    }

    // Count distinct survey IDs where food = 'Pizza'
    const [pizzaRes] = await connection.query(
      `SELECT COUNT(DISTINCT survey_id) AS pizzaCount FROM favorite_foods WHERE food = ?`, ['Pizza']
    );
    const pizzaCount = pizzaRes[0].pizzaCount;

    // Calculate percentage, rounded to 1 decimal place
    const pizzaPercentage = +( (pizzaCount / totalSurveys) * 100 ).toFixed(1);

    res.json({ pizzaPercentage });
  } catch (error) {
    console.error('Error calculating pizza percentage:', error);
    res.status(500).json({ error: 'Failed to calculate pizza percentage' });
  } finally {
    if (connection) connection.release();
  }
});


app.get('/api/surveys/pasta-percentage', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    // Get total surveys count
    const [totalRes] = await connection.query('SELECT COUNT(*) AS totalSurveys FROM surveys');
    const totalSurveys = totalRes[0].totalSurveys;

    if (totalSurveys === 0) {
      return res.json({ pastaPercentage: 0 });
    }

    // Count distinct survey IDs where food = 'Pasta'
    const [pastaRes] = await connection.query(
      `SELECT COUNT(DISTINCT survey_id) AS pastaCount FROM favorite_foods WHERE food = ?`, ['Pasta']
    );
    const pastaCount = pastaRes[0].pastaCount;

    // Calculate percentage, rounded to 1 decimal place
    const pastaPercentage = +((pastaCount / totalSurveys) * 100).toFixed(1);

    res.json({ pastaPercentage });
  } catch (error) {
    console.error('Error calculating pasta percentage:', error);
    res.status(500).json({ error: 'Failed to calculate pasta percentage' });
  } finally {
    if (connection) connection.release();
  }
});
app.get('/api/surveys/pap-and-wors-percentage', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    // Total number of surveys
    const [totalRes] = await connection.query('SELECT COUNT(*) AS totalSurveys FROM surveys');
    const totalSurveys = totalRes[0].totalSurveys;

    if (totalSurveys === 0) {
      return res.json({ papAndWorsPercentage: 0 });
    }

    // Count surveys where favorite_foods.food = 'Pap and Wors'
    const [countRes] = await connection.query(`
      SELECT COUNT(DISTINCT survey_id) AS count
      FROM favorite_foods
      WHERE food = 'Pap and Wors'
    `);

    const count = countRes[0].count;
    const percentage = (count / totalSurveys) * 100;

    res.json({ papAndWorsPercentage: +percentage.toFixed(1) });
  } catch (error) {
    console.error('Error calculating Pap and Wors percentage:', error);
    res.status(500).json({ error: 'Failed to calculate Pap and Wors percentage' });
  } finally {
    if (connection) connection.release();
  }
});


app.get('/api/surveys/average-high-ratings-per-hobby', async (req, res) => {
  const hobbies = [
    'I like to listen to radio',
    'I like to watch TV',
    'I like to listen to music',
    'I like to eat out',
    'I like to watch movies'
  ];

  let connection;
  try {
    connection = await pool.getConnection();

    // Step 1: Get total number of survey participants
    const [surveyCountRes] = await connection.query('SELECT COUNT(*) AS totalSurveys FROM surveys');
    const totalSurveys = surveyCountRes[0].totalSurveys;

    if (totalSurveys === 0) {
      return res.json(Object.fromEntries(hobbies.map(h => [h, 0])));
    }

    // Step 2: Get total sum of high ratings for each hobby
    const placeholders = hobbies.map(() => '?').join(',');
    const [rows] = await connection.query(`
      SELECT hoobies, SUM(rating) AS totalRating
      FROM ratings
      WHERE hoobies IN (${placeholders})
        AND rating IN (4, 5)
      GROUP BY hoobies
    `, hobbies);

    // Step 3: Calculate per-person averages
    const result = {};
    hobbies.forEach(hobby => {
      const found = rows.find(r => r.hoobies === hobby);
      const totalRating = found ? found.totalRating : 0;
      result[hobby] = Number((totalRating / totalSurveys).toFixed(1));
    });

    res.json(result);

  } catch (error) {
    console.error('Error calculating per-hobby averages:', error);
    res.status(500).json({ error: 'Failed to calculate averages per hobby' });
  } finally {
    if (connection) connection.release();
  }
});



const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
