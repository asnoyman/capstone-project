import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@material-ui/core';
import Cookies from 'js-cookie';
import { apiRequest } from '../Api';
import useMediaQuery from '@mui/material/useMediaQuery';

const BookedListings = () => {
  const navigate = useNavigate();
  const matches = useMediaQuery('(min-width:850px)');

  /** On click, check that the user is logged in, otherwise navigate home */
  React.useEffect(() => {
    if (Cookies.get('token') !== undefined) {
      apiRequest('token/user', undefined, 'POST').catch(() => {
        Cookies.remove('token');
        navigate('/');
        navigate(0);
      });
    }
  }, [navigate]);

  /** Navigate to the top of the booked listings page  */
  const bookedListings = () => {
    window.scrollTo(0, 0);
    navigate('/booked_listings');
  };

  return (
    <Button color="inherit" aria-label="Booked Listings" onClick={bookedListings}>
      {matches ? 'Booked Listings' : 'Booked'}
    </Button>
  );
};

export default BookedListings;
