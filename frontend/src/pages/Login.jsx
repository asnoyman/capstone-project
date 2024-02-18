import React from 'react';
import { TextField, FormControl, Box, Paper, InputAdornment, IconButton } from '@material-ui/core';
import { apiRequest } from '../Api';
import { useNavigate } from 'react-router-dom';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';
import Header from '../components/Header';
import Cookies from 'js-cookie';

const Login = () => {
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [email, setemail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [values, setValues] = React.useState({
    password: '',
    showPassword: false,
  });
  const navigate = useNavigate();
  localStorage.setItem('page', 'Login');
  document.title = 'ParkShare Login';

  /** Check if the user is already logged in, if so navigate to the home page */
  React.useEffect(() => {
    if (Cookies.get('token') !== undefined) {
      navigate('/');
    } else {
      setLoggedIn(true);
    }
  }, [navigate]);

  /** Show the password instead of dots while the mouse is down on the button */
  const handleClickShowPassword = () => {
    setValues({
      ...values,
      showPassword: !values.showPassword,
    });
  };
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  /** Log the user in */
  const login = () => {
    const data = { username: email, password: password };
    apiRequest('user/auth/login', data, 'POST', true)
      .then((json) => {
        Cookies.set('token', json.access_token);
        navigate('/');
      })
      .catch((error) => {
        alert(error.detail[0].msg);
      });
  };

  /** Call the login() function if the user clicks enter */
  React.useEffect(() => {
    const keyDownHandler = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        login();
      }
    };
    document.addEventListener('keydown', keyDownHandler);

    return () => {
      document.removeEventListener('keydown', keyDownHandler);
    };
  });

  return (
    loggedIn && (
      <>
        <Header />
        <Box style={{ display: 'flex', placeContent: 'center', marginTop: '30vh' }}>
          <Paper style={{ padding: '20px', placeContent: 'center', display: 'flex' }}>
            <FormControl>
              <TextField
                required
                id="email-input"
                label="Email"
                defaultValue=""
                onChange={(e) => setemail(e.target.value)}
              />
              <TextField
                required
                type={values.showPassword ? 'text' : 'password'}
                id="password-input"
                label="Password"
                defaultValue=""
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                      >
                        {values.showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                onChange={(e) => setPassword(e.target.value)}
              />
              <br />
              <PrimaryButton name="Log In" onClick={() => login()} />
              <br />
              <SecondaryButton name="Back to Homepage" onClick={() => navigate('/')} />
            </FormControl>
          </Paper>
        </Box>
      </>
    )
  );
};

export default Login;
