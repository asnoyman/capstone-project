import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@material-ui/core';
import Cookies from 'js-cookie';
import { apiRequest } from '../Api';

const Logout = () => {
  const navigate = useNavigate();

  /** If the user is not logged in, navigate them to the top of the home page */
  React.useEffect(() => {
    if (Cookies.get('token') !== undefined) {
      apiRequest('token/user', undefined, 'POST').catch(() => {
        Cookies.remove('token');
        navigate('/');
        navigate(0);
      });
    }
  }, [Cookies.get('token'), navigate]);

  /** Log the user out of the website */
  const logout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      apiRequest('user/auth/logout', undefined, 'POST')
        .then(() => {
          Cookies.remove('token');
          navigate('/');
          navigate(0);
        })
        .catch(() => {
          Cookies.remove('token');
          navigate('/');
          navigate(0);
        });
    }
  };

  /** Navigate the user to the login page */
  const login = () => {
    navigate('/login');
  };

  return (
    <Button
      aria-label={Cookies.get('token') !== undefined ? 'Logout' : 'Login'}
      color="inherit"
      onClick={Cookies.get('token') !== undefined ? logout : login}
    >
      {Cookies.get('token') !== undefined ? 'Logout' : 'Login'}
    </Button>
  );
};

export default Logout;
