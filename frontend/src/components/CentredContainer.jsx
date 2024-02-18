import React from 'react';
import { Container } from '@material-ui/core';
import PropTypes from 'prop-types';

const CentredContainer = ({ children }) => {
  return (
    <Container
      maxWidth="sm"
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'auto',
        minWidth: '308px',
        height: '100%',
        margin: '70px 0px 10px 0px',
        lineHeight: '1.6',
      }}
    >
      {children}
    </Container>
  );
};

CentredContainer.propTypes = {
  /** A node to be formatted inside the container */
  children: PropTypes.node.isRequired,
};

export default CentredContainer;
