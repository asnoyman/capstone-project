import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@material-ui/core';
import Cookies from 'js-cookie';
import { apiRequest } from '../Api';
import useMediaQuery from '@mui/material/useMediaQuery';

const ViewProfile = () => {
  const navigate = useNavigate();
  const matches = useMediaQuery('(min-width:850px)');

  /** If the user is not logged in, navgiate them to the top of the home page */
  React.useEffect(() => {
    if (Cookies.get('token') !== undefined) {
      apiRequest('token/user', undefined, 'POST').catch(() => {
        Cookies.remove('token');
        navigate('/');
        navigate(0);
      });
    }
  }, [Cookies.get('token'), navigate]);

  /** Naviage to the top of the user's profile page */
  const viewProfile = () => {
    window.scrollTo(0, 0);
    apiRequest('user/profile', undefined, 'GET')
      .then((data) => {
        navigate(`/view_profile/${data.id}`);
        navigate(0);
      })
      .catch(() => {
        navigate('/');
        navigate(0);
      });
  };

  return (
    <Button color="inherit" aria-label="View Profile" onClick={viewProfile}>
      {matches ? 'View Profile' : 'Profile'}
    </Button>
  );
};

export default ViewProfile;
