import React from 'react';
import { Button } from '@material-ui/core';
import PropTypes from 'prop-types';

const SecondaryButton = ({ name, onClick }) => {
  return (
    <Button aria-label={name} variant="contained" color="secondary" onClick={onClick}>
      {name}
    </Button>
  );
};

SecondaryButton.propTypes = {
  /** Contents of the button */
  name: PropTypes.string.isRequired,
  /** Function that happens when the button is clicked */
  onClick: PropTypes.func.isRequired,
};

export default SecondaryButton;
