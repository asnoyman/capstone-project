import React from 'react';
import Header from '../components/Header';
import Cookies from 'js-cookie';
import { apiRequest } from '../Api';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Grid } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';
import RedCar from '../cars/RedCar.png';
import OrangeCar from '../cars/OrangeCar.png';
import YellowCar from '../cars/YellowCar.png';
import GreenCar from '../cars/GreenCar.png';
import LightBlueCar from '../cars/LightBlueCar.png';
import BlueCar from '../cars/BlueCar.png';
import PurpleCar from '../cars/PurpleCar.png';
import PinkCar from '../cars/PinkCar.png';
import BlackCar from '../cars/BlackCar.png';
import Confetti from 'react-confetti';
import PastPuzzlesModal from '../components/PastPuzzlesModal';
import ShootEmojis from '../components/ShootEmojis';

const PuzzlePage = () => {
  const navigate = useNavigate();
  localStorage.setItem('page', 'Puzzles');
  document.title = 'Puzzles';
  const matches = useMediaQuery('(min-width:700px)');

  const date1 = parseInt(window.location.pathname.split('/')[2]);
  const date2 = new Date(date1);
  const selectedDate = date2.setHours(10, 0, 0, 0);

  const [difficulty, setDifficulty] = React.useState('');
  const [selectedNumber, setSelectedNumber] = React.useState(0);
  const [sudokuGrid, setSudokuGrid] = React.useState(null);
  const [date, setDate] = React.useState('');
  const [streak, setStreak] = React.useState(0);
  const [showConfetti, setShowConfetti] = React.useState(false);
  const [initialGrid, setInitialGrid] = React.useState(null);
  const cars = [
    RedCar,
    OrangeCar,
    YellowCar,
    GreenCar,
    LightBlueCar,
    BlueCar,
    PurpleCar,
    PinkCar,
    BlackCar,
  ];
  const [clicked, setClicked] = React.useState(false);

  React.useEffect(() => {
    if (Cookies.get('token') !== undefined) {
      apiRequest('token/user', undefined, 'POST').catch(() => {
        Cookies.remove('token');
        navigate('/');
        navigate(0);
      });
    } else {
      navigate('/');
      navigate(0);
    }
  }, [navigate]);

  React.useEffect(() => {
    if (selectedDate > new Date(Date.now()).setHours(10, 0, 0, 0) || selectedDate < 0) {
      navigate('/');
      navigate(0);
    }
    apiRequest(`puzzle/submission/${selectedDate}`, undefined, 'GET')
      .then((data) => {
        setSudokuGrid(data.submission);
        setInitialGrid(data.puzzle);
        setDate(new Date(data.date).toLocaleDateString('en-AU'));
        setDifficulty(data.difficulty);
      })
      .catch((error) => {
        console.log(error);
      });
    apiRequest(`puzzle/streak`, undefined, 'GET')
      .then((data) => {
        setStreak(data.streak);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  React.useEffect(() => {
    apiRequest(`puzzle/streak`, undefined, 'GET')
      .then((data) => {
        setStreak(data.streak);
      })
      .catch((error) => {
        console.log(error);
      });
  }, [showConfetti]);

  const handleSquareClick = (row, col) => {
    const newGrid = [...sudokuGrid];
    if (newGrid[row][col] === selectedNumber && initialGrid[row][col] === 0) {
      newGrid[row][col] = 0;
    } else if (initialGrid[row][col] === 0) {
      newGrid[row][col] = selectedNumber;
    }
    setSudokuGrid(newGrid);
    changeBackgroundColours([]);
    apiRequest(`puzzle/submission/${selectedDate}`, { submission: newGrid }, 'PUT').catch(
      (error) => {
        console.log(error);
      }
    );
  };

  const handleSelectedNumber = (number) => {
    if (selectedNumber === number) {
      setSelectedNumber(0);
    } else {
      setSelectedNumber(number);
    }
  };

  const checkSolution = () => {
    let filled = true;
    // Check rows and columns
    const errors = [];
    for (let i = 0; i < 9; i++) {
      const rowSet = new Set();
      const colSet = new Set();
      for (let j = 0; j < 9; j++) {
        const rowVal = sudokuGrid[i][j];
        const colVal = sudokuGrid[j][i];
        if (rowVal === 0 || colVal === 0) {
          filled = false;
        }
        if (rowVal !== 0) {
          if (rowSet.has(rowVal)) {
            errors.push({ row: i, col: j });
            for (let k = 0; k < 9; k++) {
              if (sudokuGrid[i][k] === rowVal) {
                errors.push({ row: i, col: k });
              }
            }
          }
          rowSet.add(rowVal);
        }
        if (colVal !== 0) {
          if (colSet.has(colVal)) {
            errors.push({ row: j, col: i });
            for (let k = 0; k < 9; k++) {
              if (sudokuGrid[k][i] === colVal) {
                errors.push({ row: k, col: i });
              }
            }
          }
          colSet.add(colVal);
        }
      }
    }

    // Check subgrids
    for (let i = 0; i < 9; i += 3) {
      for (let j = 0; j < 9; j += 3) {
        const subgridSet = new Set();
        for (let k = i; k < i + 3; k++) {
          for (let l = j; l < j + 3; l++) {
            const val = sudokuGrid[k][l];
            if (val !== 0) {
              if (subgridSet.has(val)) {
                errors.push({ row: k, col: l });
                for (let m = i; m < i + 3; m++) {
                  for (let n = j; n < j + 3; n++) {
                    if (sudokuGrid[m][n] === val) {
                      errors.push({ row: m, col: n });
                    }
                  }
                }
              }
              subgridSet.add(val);
            }
          }
        }
      }
    }

    changeBackgroundColours(errors);
    if (errors.length === 0 && filled) {
      apiRequest(`puzzle/submission/${selectedDate}`, { submission: sudokuGrid }, 'PUT')
        .then((res) => {
          if (res.completed) {
            setShowConfetti(true);
            if (selectedDate === new Date(Date.now()).setHours(10, 0, 0, 0)) {
              apiRequest('badge/add_badge_to_current_user?type_id=11', undefined, 'PUT')
                .then(() => {
                  setClicked(true);
                })
                .catch(() => {});
            }
          } else {
            alert('There is an error with your solution');
          }
        })
        .catch((error) => {
          console.log(error);
        });
    } else if (errors.length === 0) {
      alert('Your solution is not complete - there are still some empty cells');
    }
  };

  const changeBackgroundColours = (cells) => {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (initialGrid[i][j] !== 0) {
          document.getElementById(`${i}-${j}`).style.backgroundColor = '#bdbdbd';
        } else if (cells.some((cell) => cell.row === i && cell.col === j)) {
          document.getElementById(`${i}-${j}`).style.backgroundColor = '#e57373';
        } else {
          document.getElementById(`${i}-${j}`).style.backgroundColor = 'white';
        }
      }
    }
  };

  React.useEffect(() => {
    let timerId;
    if (showConfetti) {
      timerId = setTimeout(() => setShowConfetti(false), 5000);
    }
    return () => clearTimeout(timerId);
  }, [showConfetti]);

  return (
    sudokuGrid !== null && (
      <>
        <Header />
        {showConfetti && <Confetti numberOfPieces={1000} />}
        {showConfetti && (
          <Alert
            severity="success"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1,
            }}
          >
            Congratulations! You have completed the puzzle!
          </Alert>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: matches ? 'row' : 'column',
          }}
        >
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Grid container style={{ padding: '2%' }}>
              {sudokuGrid.map((row, rowIndex) => (
                <Grid
                  key={rowIndex}
                  style={{ height: matches ? '8vh' : '6vh', justifyContent: 'center' }}
                  container
                >
                  {row.map((value, colIndex) => (
                    <Button
                      key={`${rowIndex}-${colIndex}`}
                      id={`${rowIndex}-${colIndex}`}
                      variant="outlined"
                      onClick={() => handleSquareClick(rowIndex, colIndex)}
                      disabled={initialGrid[rowIndex][colIndex] !== 0 && true}
                      style={{
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        backgroundSize: '80%',
                        backgroundImage: value !== 0 && `url(${cars[value - 1]})`,
                        cursor: initialGrid[rowIndex][colIndex] !== 0 ? 'auto' : 'pointer',
                        backgroundColor: initialGrid[rowIndex][colIndex] !== 0 && '#bdbdbd',
                        width: '10%',
                        height: '100%',
                        minWidth: '0px',
                        padding: '0',
                        borderRadius: '0px',
                        borderTop: rowIndex === 0 ? '4px solid black' : '1px solid black',
                        borderLeft: colIndex === 0 ? '4px solid black' : '1px solid black',
                        borderBottom: rowIndex % 3 === 2 ? '4px solid black' : '1px solid black',
                        borderRight: colIndex % 3 === 2 ? '4px solid black' : '1px solid black',
                      }}
                    ></Button>
                  ))}
                </Grid>
              ))}
            </Grid>
            <PastPuzzlesModal />
          </div>
          <div
            style={{
              width: '30%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div style={{ textAlign: 'center' }}>{`Streak: ${streak}`}</div>
            <div style={{ textAlign: 'center' }}>
              {`Date: ${date}`}{' '}
              {selectedDate === new Date(Date.now()).setHours(10, 0, 0, 0) && '(Current)'}
            </div>
            <div style={{ textAlign: 'center' }}>{`Difficulty: ${difficulty}`}</div>
            <Grid
              container
              style={{
                display: 'grid',
                gridTemplate: 'repeat(3, 1fr) / repeat(3, 1fr)',
                height: matches ? '30vh' : '20vh',
                padding: '2%',
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
                <Button
                  key={number}
                  variant="outlined"
                  onClick={() => handleSelectedNumber(number)}
                  style={{
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    backgroundSize: '80%',
                    backgroundImage: `url(${cars[number - 1]})`,
                    backgroundColor: selectedNumber === number && '#ce93d8',
                    color: selectedNumber === number && 'white',
                    padding: '0',
                    margin: '2%',
                    minWidth: '0px',
                    border: '1px solid black',
                  }}
                ></Button>
              ))}
            </Grid>
            <div style={{ display: 'flex', gap: '20%', width: '80%', justifyContent: 'center' }}>
              <PrimaryButton name="Submit" onClick={checkSolution} />
              <SecondaryButton
                name="Reset"
                onClick={() => {
                  if (window.confirm('Are you sure you want to reset this puzzle?')) {
                    setSudokuGrid(JSON.parse(JSON.stringify(initialGrid)));
                    changeBackgroundColours([]);
                    apiRequest(`puzzle/submission/${selectedDate}`, undefined, 'DELETE').catch(
                      (error) => {
                        console.log(error);
                      }
                    );
                  }
                }}
              />
            </div>
            <br />
            {selectedDate !== new Date(Date.now()).setHours(10, 0, 0, 0) && (
              <PrimaryButton
                name="View Solution"
                onClick={() => {
                  if (window.confirm('Are you sure you want to reveal the solution?')) {
                    changeBackgroundColours([]);
                    apiRequest(`puzzle/solution/${selectedDate}`, undefined, 'GET')
                      .then((data) => {
                        setSudokuGrid(data.solution);
                        apiRequest(
                          `puzzle/submission/${selectedDate}`,
                          { submission: data.solution },
                          'PUT'
                        ).catch((error) => {
                          console.log(error);
                        });
                      })
                      .catch((error) => {
                        console.log(error);
                      });
                  }
                }}
              />
            )}
          </div>
        </div>
        {clicked && (
          <ShootEmojis
            emojis={['🧩']}
            complete={() => {
              setClicked(false);
            }}
          />
        )}
      </>
    )
  );
};

export default PuzzlePage;
