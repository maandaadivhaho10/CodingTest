import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import './index.css';

function SurveyForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    dob: '',
    contact: '',
    favoriteFood: [],
    ratings: {}
  });

  const questions = [
    'I like to watch movies',
    'I like to listen to music',
    'I like to listen to radio',
    'I like to eat out',
    'I like to watch TV'
  ];

  const handleInput = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckbox = (e) => {
    const { value, checked } = e.target;
    let updated = [...formData.favoriteFood];
    if (checked) updated.push(value);
    else updated = updated.filter(f => f !== value);
    setFormData({ ...formData, favoriteFood: updated });
  };

  const handleRadioChange = (q, val) => {
    setFormData({ ...formData, ratings: { ...formData.ratings, [q]: val } });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
    // You can send to backend here using axios.post('/api/submit', formData)
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
          <label>Full Name <input name="fullName" onChange={handleInput} /></label>
          <label>Email <input name="email" onChange={handleInput} /></label>
          <label>Date of Birth <input name="dob" type="date" onChange={handleInput} /></label>
          <label>Contact Number <input name="contact" onChange={handleInput} /></label>
        </div>

        <div className="section">
          <p>What is your favorite food?</p>
          {['Pizza', 'Pasta', 'Pap and Wors', 'Other'].map(item => (
            <label key={item}>
              <input type="checkbox" value={item} onChange={handleCheckbox} />
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
                {[1, 2, 3, 4, 5].map((n, i) => (
                  <th key={i}>{['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'][i]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {questions.map((q, i) => (
                <tr key={i}>
                  <td>{q}</td>
                  {[1, 2, 3, 4, 5].map(num => (
                    <td key={num}>
                      <input
                        type="radio"
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
    axios.get('http://localhost:3001/api/survey-results')
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="container">
      <nav className="nav">
        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>FILL OUT SURVEY</NavLink>
        <NavLink to="/results" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>VIEW SURVEY RESULTS</NavLink>
      </nav>

      <h2>Survey Results</h2>

      {!data ? (
        <p>Loading...</p>
      ) : data.message ? (
        <p>{data.message}</p>
      ) : (
        <table className="results-table">
          <tbody>
            <tr><td>Total Surveys</td><td>{data.totalSurveys}</td></tr>
            <tr><td>Average Age</td><td>{data.avgAge}</td></tr>
            <tr><td>Oldest Age</td><td>{data.maxAge}</td></tr>
            <tr><td>Youngest Age</td><td>{data.minAge}</td></tr>
            <tr><td>% Who Like Pizza</td><td>{data.pizzaPercentage}%</td></tr>
             <tr><td>% Who Like Pasta</td><td>{data.pastaPercentage}%</td></tr>
               <tr><td>% Who Like Pap and Wors</td><td>{data.papAndWorsPercentage}%</td></tr>
                 <tr><td>% Who Like Watching Movies</td><td>{data.moviesAverage}%</td></tr>
                   <tr><td>% Who Like Listen Radio</td><td>{data.radioAverage}%</td></tr>
            <tr><td>Average "Eat Out" Rating</td><td>{data.eatOutAverage}</td></tr>
            <tr><td>% Who Like Watching TV</td><td>{data.tvAverage}%</td></tr>
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
