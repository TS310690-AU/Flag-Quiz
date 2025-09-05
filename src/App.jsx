import React, { useState, useEffect } from 'react';

const TOTAL_QUESTIONS = 10;
const OPTIONS_COUNT = 4;

// Mock data as fallback
const mockCountries = [
  {
    name: { common: "United States" },
    flags: { svg: "https://flagcdn.com/us.svg" },
    cca2: "US"
  },
  {
    name: { common: "Canada" },
    flags: { svg: "https://flagcdn.com/ca.svg" },
    cca2: "CA"
  },
  {
    name: { common: "United Kingdom" },
    flags: { svg: "https://flagcdn.com/gb.svg" },
    cca2: "GB"
  },
  {
    name: { common: "France" },
    flags: { svg: "https://flagcdn.com/fr.svg" },
    cca2: "FR"
  },
  {
    name: { common: "Germany" },
    flags: { svg: "https://flagcdn.com/de.svg" },
    cca2: "DE"
  },
  {
    name: { common: "Japan" },
    flags: { svg: "https://flagcdn.com/jp.svg" },
    cca2: "JP"
  },
  {
    name: { common: "Australia" },
    flags: { svg: "https://flagcdn.com/au.svg" },
    cca2: "AU"
  },
  {
    name: { common: "Brazil" },
    flags: { svg: "https://flagcdn.com/br.svg" },
    cca2: "BR"
  },
  {
    name: { common: "India" },
    flags: { svg: "https://flagcdn.com/in.svg" },
    cca2: "IN"
  },
  {
    name: { common: "China" },
    flags: { svg: "https://flagcdn.com/cn.svg" },
    cca2: "CN"
  },
  {
    name: { common: "Mexico" },
    flags: { svg: "https://flagcdn.com/mx.svg" },
    cca2: "MX"
  },
  {
    name: { common: "Italy" },
    flags: { svg: "https://flagcdn.com/it.svg" },
    cca2: "IT"
  },
  {
    name: { common: "Spain" },
    flags: { svg: "https://flagcdn.com/es.svg" },
    cca2: "ES"
  },
  {
    name: { common: "Russia" },
    flags: { svg: "https://flagcdn.com/ru.svg" },
    cca2: "RU"
  },
  {
    name: { common: "South Korea" },
    flags: { svg: "https://flagcdn.com/kr.svg" },
    cca2: "KR"
  }
];

const App = () => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    let timeoutId;

    const fetchCountries = async () => {
      try {
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch('https://restcountries.com/v3.1/all', { 
          signal: controller.signal 
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Filter countries that have proper flag and name data
        const validCountries = data.filter(country => 
          country.flags && 
          country.flags.svg && 
          country.name && 
          country.name.common &&
          country.cca2
        );
        
        setCountries(validCountries);
        setLoading(false);
        setError(null);
      } catch (err) {
        clearTimeout(timeoutId);
        if (retryCount < maxRetries && err.name !== 'AbortError') {
          console.error('Failed to fetch countries (retrying):', err);
          setRetryCount(prevCount => prevCount + 1);
          setTimeout(fetchCountries, 2000);
        } else {
          console.error('Failed to fetch countries (using mock data):', err);
          setCountries(mockCountries);
          setError(err);
          setLoading(false);
        }
      }
    };

    fetchCountries();

    return () => clearTimeout(timeoutId);
  }, [retryCount]);

  const generateQuizQuestions = (countriesData) => {
    if (countriesData.length < OPTIONS_COUNT) {
      console.error('Not enough countries to generate quiz');
      return [];
    }

    const questions = [];
    const usedCountries = new Set();

    for (let i = 0; i < Math.min(TOTAL_QUESTIONS, countriesData.length); i++) {
      // Select a random country for the correct answer
      let correctCountry;
      let attempts = 0;
      do {
        correctCountry = countriesData[Math.floor(Math.random() * countriesData.length)];
        attempts++;
      } while (usedCountries.has(correctCountry.cca2) && attempts < 50);

      if (attempts >= 50) break; // Prevent infinite loop

      usedCountries.add(correctCountry.cca2);

      // Select incorrect options
      const incorrectOptions = [];
      const availableCountries = countriesData.filter(c => c.cca2 !== correctCountry.cca2);
      
      while (incorrectOptions.length < OPTIONS_COUNT - 1 && availableCountries.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableCountries.length);
        const randomCountry = availableCountries[randomIndex];
        
        if (!incorrectOptions.some(opt => opt.name.common === randomCountry.name.common)) {
          incorrectOptions.push(randomCountry);
        }
        
        availableCountries.splice(randomIndex, 1);
      }

      // Combine and shuffle options
      const allOptions = [correctCountry, ...incorrectOptions];
      const shuffledOptions = allOptions.sort(() => Math.random() - 0.5);

      questions.push({
        id: i + 1,
        flag: correctCountry.flags.svg,
        correctAnswer: correctCountry.name.common,
        options: shuffledOptions.map(c => c.name.common),
        country: correctCountry
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
    // Reset all game state
    setCurrentQuestion(0);
    setScore(0);
    setFeedback('');
    setSelectedAnswer(null);
    setGameOver(false);
    setRetryCount(0);
    
    // Regenerate questions from existing countries
    if (countries.length > 0) {
      const newQuestions = generateQuizQuestions(countries);
      setQuizQuestions(newQuestions);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '200px',
        fontSize: '18px'
      }}>
        Loading country data...
      </div>
    );
  }

  if (gameOver) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '20px',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <h1 style={{ color: '#2c3e50', marginBottom: '20px' }}>Quiz Completed!</h1>
        <p style={{ fontSize: '20px', marginBottom: '10px' }}>
          Final Score: {score} / {quizQuestions.length}
        </p>
        <p style={{ marginBottom: '30px' }}>
          {score > quizQuestions.length / 2 ? 'Well done! 🎉' : 'Try again to improve your score! 💪'}
        </p>
        <button 
          onClick={restartGame}
          style={{
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            fontSize: '16px',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'background-color 0.3s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
        >
          Play Again
        </button>
        {error && (
          <p style={{ 
            color: '#e67e22', 
            fontSize: '14px', 
            marginTop: '20px' 
          }}>
            Note: Using offline data due to connection issues
          </p>
        )}
      </div>
    );
  }

  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h1 style={{ 
        color: '#2c3e50',
        marginBottom: '20px',
        fontSize: '28px'
      }}>
        Select the country/territory with this flag
      </h1>
      
      {quizQuestions.length > 0 && (
        <>
          <p style={{ 
            fontSize: '16px', 
            marginBottom: '20px',
            color: '#7f8c8d'
          }}>
            Question {currentQuestion + 1} of {quizQuestions.length}
          </p>
          
          <div style={{ marginBottom: '30px' }}>
            <img
              src={quizQuestions[currentQuestion].flag}
              alt="Country flag"
              style={{ 
                width: '200px', 
                height: '133px', 
                border: '2px solid #bdc3c7', 
                objectFit: 'contain',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
              onError={(e) => {
                console.error('Flag failed to load:', quizQuestions[currentQuestion].flag);
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEzMyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWNmMGYxIiBzdHJva2U9IiNiZGMzYzciLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjN2Y4YzhkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tmv+gZmxhZzwvdGV4dD48L3N2Zz4=';
              }}
            />
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '10px',
            marginBottom: '20px'
          }}>
            {quizQuestions[currentQuestion].options.map((option) => (
              <button
                key={option}
                onClick={() => handleAnswer(option)}
                disabled={selectedAnswer !== null}
                style={{
                  padding: '12px 16px',
                  fontSize: '14px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: selectedAnswer !== null ? 'default' : 'pointer',
                  transition: 'all 0.3s',
                  backgroundColor: selectedAnswer === null 
                    ? '#3498db' 
                    : selectedAnswer === option
                      ? option === quizQuestions[currentQuestion].correctAnswer
                        ? '#27ae60'
                        : '#e74c3c'
                      : '#95a5a6',
                  color: 'white',
                  opacity: selectedAnswer !== null && selectedAnswer !== option ? 0.7 : 1
                }}
                onMouseOver={(e) => {
                  if (selectedAnswer === null) {
                    e.target.style.backgroundColor = '#2980b9';
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedAnswer === null) {
                    e.target.style.backgroundColor = '#3498db';
                  }
                }}
              >
                {option}
              </button>
            ))}
          </div>
          
          {feedback && (
            <div style={{ 
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: selectedAnswer === quizQuestions[currentQuestion].correctAnswer ? '#d5f4e6' : '#fceaea',
              color: selectedAnswer === quizQuestions[currentQuestion].correctAnswer ? '#27ae60' : '#e74c3c',
              borderRadius: '6px',
              border: `1px solid ${selectedAnswer === quizQuestions[currentQuestion].correctAnswer ? '#27ae60' : '#e74c3c'}`
            }}>
              <p style={{ margin: 0, fontSize: '16px' }}>{feedback}</p>
            </div>
          )}
          
          {selectedAnswer && (
            <button 
              onClick={nextQuestion}
              style={{
                backgroundColor: '#34495e',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                fontSize: '16px',
                borderRadius: '6px',
                cursor: 'pointer',
                marginBottom: '20px',
                transition: 'background-color 0.3s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#2c3e50'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#34495e'}
            >
              {currentQuestion + 1 < quizQuestions.length ? 'Next Question' : 'Finish Quiz'}
            </button>
          )}
          
          <p style={{ 
            fontSize: '18px', 
            fontWeight: 'bold',
            color: '#2c3e50'
          }}>
            Score: {score} / {currentQuestion + (selectedAnswer ? 1 : 0)}
          </p>
        </>
      )}
      
      {error && (
        <p style={{ 
          color: '#e67e22', 
          fontSize: '14px', 
          marginTop: '20px',
          fontStyle: 'italic'
        }}>
          Using offline data due to connection issues
        </p>
      )}
    </div>
  );
};

export default App;