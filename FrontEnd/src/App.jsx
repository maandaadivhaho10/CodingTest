import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import './index.css';

function SurveyForm() {
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    dateofBirth: '',
    contact: '',
    favoriteFoods: [],
    ratings: {}
  });

  const questions = [
    'I like to listen to radio',
    'I like to watch TV',
    'I like to listen to music',
    'I like to eat out',
    'I like to watch movies'
  ];

  const handleInput = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckbox = (e) => {
    const { value, checked } = e.target;
    let updated = [...formData.favoriteFoods];
    if (checked) updated.push(value);
    else updated = updated.filter(f => f !== value);
    setFormData({ ...formData, favoriteFoods: updated });
  };

  const handleRadioChange = (q, val) => {
    setFormData({ ...formData, ratings: { ...formData.ratings, [q]: val } });
  };


const handleSubmit = async (e) => {
  e.preventDefault();

  const { fullname, email, dateofBirth, contact, ratings } = formData;
  if (!fullname || !email || !dateofBirth || !contact ) {
    alert('Please fill out all personal details.');
    return;
  }

  // Validate age
  const birthDate = new Date(dateofBirth);
  const ageDifMs = Date.now() - birthDate.getTime();
  const ageDate = new Date(ageDifMs);
  const age = Math.abs(ageDate.getUTCFullYear() - 1970);

  if (age < 5 || age > 120) {
    alert('Age must be between 5 and 120 years.');
    return;
  }

  // Validate that all rating questions have responses
  const missingRatings = questions.some(q => !ratings[q]);
  if (missingRatings) {
    alert('Please select a rating for every question.');
    return;
  }

  // All validations passed
  console.log('Submitting data:', formData);

  try {
    await axios.post('http://localhost:3000/api/survey', formData);
    alert('Survey submitted successfully!');
    setFormData({
      fullname: '',
      email: '',
      dateofBirth: '',
      contact: '',
      favoriteFoods: [],
      ratings: {}
    });
  } catch (error) {
    console.error('Error submitting survey:', error);
    const errorMsg = error.response?.data?.message || error.response?.data || error.message || 'Failed to submit survey. Please try again.';
    alert(`Failed to submit survey: ${errorMsg}`);
  }
};


  return (
    <div className="container">
      <h3>_Survey</h3>
      <nav className="nav">
        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>FILL OUT SURVEY</NavLink>
        <NavLink to="/results" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>VIEW SURVEY RESULTS</NavLink>
      </nav>

      <form className="survey-form" onSubmit={handleSubmit}>
        <p>Personal Details:</p>
        <div className="form-wrapper">
          <label>Full Name <input name="fullname" onChange={handleInput} /></label>
          <label>Email <input name="email" onChange={handleInput} /></label>
          <label>Date of Birth <input name="dateofBirth" type="date" onChange={handleInput} /></label>
          <label>Contact Number <input name="contact" onChange={handleInput} /></label>
        </div>
<div className="section favorite-foods-row">
  <p className="favorite-foods-label">What is your favorite food?</p>
  {['Pizza', 'Pasta', 'Pap and Wors', 'Other'].map(item => (
    <label key={item} className="custom-checkbox-label">
      <input
        type="checkbox"
        value={item}
        onChange={handleCheckbox}
        className="custom-checkbox-input"
      />
      <span className="custom-checkbox-box"></span>
      {item}
    </label>
  ))}
</div>



        <div className="section">
          <p>Please rate your level of agreement from 1 to 5:</p>
          <table>
            <thead>
              <tr>
                <th></th>
                {[5, 4, 3, 2, 1].map((n, i) => (
                  <th key={i}>{['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'][i]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {questions.map((q, i) => (
                <tr key={i}>
                  <td>{q}</td>
                  {[5, 4, 3, 2, 1].map(num => (
                    <td key={num}>
                      <input
                        type="radio" className="accent-blue-500"
                        name={`q${i}`}
                        onChange={() => handleRadioChange(q, num)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button type="submit">SUBMIT</button>
      </form>
    </div>
  );
}


function Results() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          totalRes,
          avgAgeRes,
          minAgeRes,
          maxAgeRes,
          pizzaRes,
          pastaRes,
          papWorsRes,
          ratingsRes
        ] = await Promise.all([
          axios.get('http://localhost:3000/total-surveys'),
          axios.get('http://localhost:3000/api/surveys/average-age'),
          axios.get('http://localhost:3000/api/survey/youngest-age'),
          axios.get('http://localhost:3000/api/survey/oldest-age'),
          axios.get('http://localhost:3000/api/surveys/pizza-percentage'),
          axios.get('http://localhost:3000/api/surveys/pasta-percentage'),
          axios.get('http://localhost:3000/api/surveys/pap-and-wors-percentage'),
          axios.get('http://localhost:3000/api/surveys/average-high-ratings-per-hobby')
        ]);

        setData({
          totalSurveys: totalRes.data.total_surveys,
          avgAge: avgAgeRes.data.averageAge,
          minAge: minAgeRes.data.youngestAge,
          maxAge: maxAgeRes.data.oldestAge,
          pizzaPercentage: pizzaRes.data.pizzaPercentage,
          pastaPercentage: pastaRes.data.pastaPercentage,
          papAndWorsPercentage: papWorsRes.data.papAndWorsPercentage,
          ...ratingsRes.data // includes movie, TV, radio, music, eat out
        });
      } catch (error) {
        console.error('Error loading results:', error);
        setData({ message: 'Failed to load survey results' });
      }
    };

    fetchData();
  }, []);

  return (
    <div className="container">
       <h3>_Surveys</h3>
      <nav className="nav">
        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          FILL OUT SURVEY
        </NavLink>
        <NavLink to="/results" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          VIEW SURVEY RESULTS
        </NavLink>
      </nav>

     <center> <h2>Survey Results</h2> </center>

      {!data ? (
        <p>Loading...</p>
      ) : data.message ? (
        <p>{data.message}</p>
      ) : (
        <table className="results-table">
          <tbody>
            <tr><td>Total Surveys:</td><td>{data.totalSurveys}</td></tr>
            <tr><td>Average Age:</td><td>{data.avgAge}</td></tr>
            <tr><td>Oldest Age:</td><td>{data.maxAge}</td></tr>
            <tr><td>Youngest Age:</td><td>{data.minAge}</td></tr>
            <tr><td> Who Like Pizza:</td><td>{data.pizzaPercentage}%</td></tr>
            <tr><td>Who Like Pasta:</td><td>{data.pastaPercentage}%</td></tr>
            <tr><td>Who Like Pap and Wors:</td><td>{data.papAndWorsPercentage}%</td></tr>
            <tr><td>Avg Rating: Watching Movies:</td><td>{data['I like to watch movies']}</td></tr>
            <tr><td>Avg Rating: Listening to Radio:</td><td>{data['I like to listen to radio']}</td></tr>
            <tr><td>Avg Rating: Eating Out:</td><td>{data['I like to eat out']}</td></tr>
            <tr><td>Avg Rating: Watching TV:</td><td>{data['I like to watch TV']}</td></tr>
            <tr><td>Avg Rating: Listening to Music:</td><td>{data['I like to listen to music']}</td></tr>
          </tbody>
        </table>
      )}
    </div>
  );
}


export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SurveyForm />} />
        <Route path="/results" element={<Results />} />
      </Routes>
    </Router>
  );
}
