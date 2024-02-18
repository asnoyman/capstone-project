import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@material-ui/core';
import Cookies from 'js-cookie';
import { apiRequest } from '../Api';

const Puzzles = () => {
  const navigate = useNavigate();

  /** If the user is not logged in, navigate to the top of the home page */
  React.useEffect(() => {
    if (Cookies.get('token') !== undefined) {
      apiRequest('token/user', undefined, 'POST').catch(() => {
        Cookies.remove('token');
        navigate('/');
        navigate(0);
      });
    }
  }, [navigate]);

  /** Navigate to the top of the puzzle page */
  const puzzlePage = () => {
    window.scrollTo(0, 0);
    navigate(`/puzzles/${new Date(Date.now()).setHours(10, 0, 0, 0).valueOf()}`);
  };

  return (
    <Button color="inherit" aria-label="Booked Listings" onClick={puzzlePage}>
      Puzzles
    </Button>
  );
};

export default Puzzles;
