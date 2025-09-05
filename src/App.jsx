import React, { useState, useEffect } from 'react';
import { useCountries } from 'use-react-countries';
import './App.css';

const TOTAL_QUESTIONS = 10;
const OPTIONS_COUNT = 4;

const App = () => {
  const { countries: fetchedCountries, loading, error } = useCountries();
  const [countries, setCountries] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (fetchedCountries && fetchedCountries.length > 0) {
      setCountries(fetchedCountries.filter((c) => c.flags?.png && c.name?.common));
    }
  }, [fetchedCountries]);

  const generateQuizQuestions = (countriesData) => {
    const questions = [];
    const availableCountries = [...countriesData];

    for (let i = 0; i < Math.min(TOTAL_QUESTIONS, availableCountries.length); i++) {
      // Remove the countries used in previous questions
      const unusedCountries = availableCountries.filter(
        (country) => !questions.some((q) => q.correctAnswer === country.name.common)
      );

      // Select a random country for the correct answer
      const correctCountryIndex = Math.floor(Math.random() * unusedCountries.length);
      const correctCountry = unusedCountries[correctCountryIndex];

      // Remove the correct country from available countries to avoid duplicates
      const remainingCountries = unusedCountries.filter(
        (country) => country.name.common !== correctCountry.name.common
      );

      // Select 3 random incorrect countries
      const incorrectOptions = [];
      for (let j = 0; j < OPTIONS_COUNT - 1; j++) {
        if (remainingCountries.length === 0) break;
        
        const randomIndex = Math.floor(Math.random() * remainingCountries.length);
        incorrectOptions.push(remainingCountries[randomIndex]);
        
        // Remove the selected incorrect country to avoid duplicates
        remainingCountries.splice(randomIndex, 1);
      }

      // Combine and shuffle options
      const options = [...incorrectOptions, correctCountry];
      const shuffledOptions = options.sort(() => Math.random() - 0.5);

      questions.push({
        id: i + 1,
        flag: correctCountry.flags?.png || correctCountry.flags?.svg,
        correctAnswer: correctCountry.name.common,
        options: shuffledOptions.map((c) => c.name.common),
      });
    }

    return questions;
  };

  useEffect(() => {
    if (countries.length > 0) {
      const questions = generateQuizQuestions(countries);
      setQuizQuestions(questions);
    }
  }, [countries]);

  const handleAnswer = (answer) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(answer);

    if (quizQuestions[currentQuestion].correctAnswer === answer) {
      setScore(score + 1);
      setFeedback(`Correct! That is the flag of ${answer}.`);
    } else {
      setFeedback(`Incorrect. The correct answer was ${quizQuestions[currentQuestion].correctAnswer}.`);
    }
  };

  const nextQuestion = () => {
    setSelectedAnswer(null);
    setFeedback('');
    if (currentQuestion + 1 < quizQuestions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setGameOver(true);
    }
  };

  const restartGame = () => {
    // Regenerate questions by regenerating the quiz from the existing countries
    const newQuestions = generateQuizQuestions(countries);
    
    setQuizQuestions(newQuestions);
    setCurrentQuestion(0);
    setScore(0);
    setFeedback('');
    setSelectedAnswer(null);
    setGameOver(false);
  };

  if (gameOver) {
    return (
      <div className="App">
        <h1>Quiz Completed!</h1>
        <p>Final Score: {score} / {quizQuestions.length}</p>
        <button onClick={restartGame}>Play Again</button>
      </div>
    );
  }

  return (
    <div className="App">
      <h1>Select the country/territory with this flag</h1>
      {quizQuestions.length > 0 && (
        <>
          <p>
            Question {currentQuestion + 1} of {quizQuestions.length}
          </p>
          <img
            src={quizQuestions[currentQuestion].flag}
            alt="Country flag"
            style={{ width: '200px', height: 'auto', border: '1px solid #ccc' }}
            onError={(e) => {
              console.log('Flag failed to load:', quizQuestions[currentQuestion].flag);
              e.target.style.display = 'none';
            }}
            onLoad={() => console.log('Flag loaded successfully:', quizQuestions[currentQuestion].flag)}
          />
          <div className="options">
            {quizQuestions[currentQuestion].options.map((option) => (
              <button
                key={option}
                className={`option ${
                  selectedAnswer === option
                    ? option === quizQuestions[currentQuestion].correctAnswer
                      ? 'correct'
                      : 'incorrect'
                    : ''
                }`}
                onClick={() => handleAnswer(option)}
                disabled={selectedAnswer !== null}
              >
                {option}
              </button>
            ))}
          </div>
          {feedback && <p>{feedback}</p>}
          {selectedAnswer && (
            <button onClick={nextQuestion} className="next-button">
              Next Question
            </button>
          )}
          <p>Score: {score}</p>
        </>
      )}
    </div>
  );
};

export default App;