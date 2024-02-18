import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@material-ui/core';
import Cookies from 'js-cookie';
import { apiRequest } from '../Api';
import useMediaQuery from '@mui/material/useMediaQuery';

const AllListings = () => {
  const navigate = useNavigate();
  const matches = useMediaQuery('(min-width:675px)');

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

  /** Scroll to the top and navigate to the home page */
  const allListings = () => {
    window.scrollTo(0, 0);
    navigate('/');
  };

  return (
    <Button aria-label="All Listings" color="inherit" onClick={allListings}>
      {matches ? 'All Listings' : 'All'}
    </Button>
  );
};

export default AllListings;
