import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@material-ui/core';
import Cookies from 'js-cookie';
import { apiRequest } from '../Api';
import useMediaQuery from '@mui/material/useMediaQuery';

const HostedListings = () => {
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

  /** Navigate to the top of the hosted listings page  */
  const hostedListings = () => {
    window.scrollTo(0, 0);
    navigate('/hosted_listings');
  };

  return (
    <Button color="inherit" aria-label="Hosted Listings" onClick={hostedListings}>
      {matches ? 'Hosted Listings' : 'Hosted'}
    </Button>
  );
};

export default HostedListings;
