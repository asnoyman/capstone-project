import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@material-ui/core';

const Register = () => {
  const navigate = useNavigate();

  /** Navigates to the top of the register page */
  return (
    <Button
      color="inherit"
      id="register-button"
      aria-label="Register"
      onClick={() => {
        navigate('/register');
      }}
    >
      Register
    </Button>
  );
};

export default Register;
