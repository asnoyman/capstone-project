import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Logout from './Logout';
import { useNavigate } from 'react-router-dom';
import { Button } from '@material-ui/core';
import useMediaQuery from '@mui/material/useMediaQuery';
import Cookies from 'js-cookie';
import Register from './Register';
import AllListings from './AllListings';
import HostedListings from './HostedListings';
import { apiRequest } from '../Api';
import BookedListings from './BookedListings';
import ViewProfile from './ViewProfile';
import Puzzles from './Puzzles';

const Header = () => {
  const navigate = useNavigate();
  const matches = useMediaQuery('(min-width:1000px)');
  const logo = useMediaQuery('(min-width:620px)');
  const [admin, setAdmin] = React.useState(false);
  var pageTitle = localStorage.getItem('page');
  if (pageTitle === 'Login' || pageTitle === 'Register') {
    pageTitle = 'ParkShare';
  }

  /** Adds the admin button to the header if the user is an admin */
  React.useEffect(() => {
    if (Cookies.get('token') !== undefined) {
      apiRequest('token/admin', undefined, 'POST')
        .then(() => {
          setAdmin(true);
        })
        .catch(() => {
          setAdmin(false);
        });
    }
  }, [Cookies.get('token')]);

  /** Navigates to the top if the admin page */
  const toAdmin = () => {
    window.scrollTo(0, 0);
    navigate(`/admin`);
  };

  return (
    <AppBar
      position="fixed"
      style={{ backgroundColor: '#1976d2', color: '#fff' }}
      sx={{
        left: 0,
        minWidth: '400px',
        height: '60px',
      }}
    >
      <Toolbar
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          height: '60px',
          overflowY: 'scroll',
          width: !logo && '95vw',
        }}
      >
        {
          <Button
            color="inherit"
            aria-label={localStorage.getItem('page')}
            style={{ fontSize: '12pt', padding: '0px', minWidth: '0' }}
            onClick={() => {
              window.scrollTo(0, 0);
              navigate('/');
            }}
          >
            {logo &&
              (matches ? (
                pageTitle
              ) : (
                <img
                  src="https://cdn-icons-png.flaticon.com/512/1295/1295144.png"
                  style={{ maxHeight: '40px', maxWidth: '40px' }}
                  alt="ParkShare Logo"
                />
              ))}
          </Button>
        }
        <div style={{ display: 'flex' }}>
          {Cookies.get('token') !== undefined && (
            <>
              <Puzzles />
              <AllListings />
              <HostedListings />
              <BookedListings />
              <ViewProfile />
            </>
          )}
          {localStorage.getItem('page') !== 'Login' && <Logout />}
          {localStorage.getItem('page') !== 'Register' && Cookies.get('token') === undefined && (
            <Register />
          )}
          {admin && (
            <Button
              color="inherit"
              style={{ color: 'white' }}
              aria-label="Admin Button"
              onClick={toAdmin}
            >
              Admin
            </Button>
          )}
        </div>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
