import React from 'react';
import { Popover } from '@material-ui/core';
import { Box, Rating } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import Cookies from 'js-cookie';

const HoverRating = ({ id, svg, ratingSpread }) => {
  const [openedPopover, setOpenedPopover] = React.useState(-1);
  const navigate = useNavigate();

  /** Sets the id of the listing that the user is hovering over  */
  const popoverEnter = (id) => {
    setOpenedPopover(id);
  };

  /** Removes the id of the listing when the user stops hovering over the listing  */
  const popoverLeave = () => {
    setOpenedPopover(-1);
  };

  const linkStyle = {
    cursor: 'pointer',
  };

  /**
   * Shows the rating spread when the user hovers over the Rating object
   * @param {[Number]} ratingSpread
   * @returns the react with the rating info
   */
  const showHover = (ratingSpread) => {
    return (
      <div
        style={linkStyle}
        onClick={(e) => {
          e.stopPropagation();
          if (Cookies.get('token') === undefined) {
            alert('You must be logged in to view reviews of a listing');
          } else {
            navigate(`/reviews/${openedPopover}`);
          }
        }}
      >
        <div aria-label="1-star-ratings">
          1 star: {ratingSpread[0]} (
          {ratingSpread[5] === 0
            ? 0
            : Math.round((ratingSpread[0] / ratingSpread[5]) * 10000) / 100}
          %){' '}
        </div>
        <div aria-label="2-star-ratings">
          2 stars: {ratingSpread[1]} (
          {ratingSpread[5] === 0
            ? 0
            : Math.round((ratingSpread[1] / ratingSpread[5]) * 10000) / 100}
          %){' '}
        </div>
        <div aria-label="3-star-ratings">
          3 stars: {ratingSpread[2]} (
          {ratingSpread[5] === 0
            ? 0
            : Math.round((ratingSpread[2] / ratingSpread[5]) * 10000) / 100}
          %){' '}
        </div>
        <div aria-label="4-star-ratings">
          4 stars: {ratingSpread[3]} (
          {ratingSpread[5] === 0
            ? 0
            : Math.round((ratingSpread[3] / ratingSpread[5]) * 10000) / 100}
          %){' '}
        </div>
        <div aria-label="5-star-ratings">
          5 stars: {ratingSpread[4]} (
          {ratingSpread[5] === 0
            ? 0
            : Math.round((ratingSpread[4] / ratingSpread[5]) * 10000) / 100}
          %){' '}
        </div>
      </div>
    );
  };

  return (
    <Box
      key={`svg${id}`}
      onMouseEnter={() => {
        popoverEnter(id);
      }}
      onMouseLeave={popoverLeave}
      aria-owns={openedPopover !== -1 ? 'mouse-over-popover' : undefined}
      aria-haspopup="true"
      aria-label="hover-span"
      style={{ cursor: 'pointer' }}
      onClick={(e) => {
        e.stopPropagation();
        if (Cookies.get('token') === undefined) {
          alert('You must be logged in to view reviews of a listing');
        } else {
          navigate(`/reviews/${openedPopover}`);
        }
      }}
    >
      <Rating name="half-rating-read" value={svg} precision={0.1} id={`svg${id}`} readOnly />
      <Popover
        id="mouse-over-popover"
        open={openedPopover !== -1 && openedPopover === id}
        style={{ pointerEvents: 'none', marginTop: '5px' }}
        anchorEl={document.getElementById(`svg${id}`)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        onClose={popoverLeave}
        PaperProps={{
          onMouseEnter: () => {
            popoverEnter(id);
          },
          onMouseLeave: popoverLeave,
        }}
      >
        <div
          style={{ pointerEvents: 'auto' }}
          aria-label="ratings"
          onClick={(e) => {
            e.stopPropagation();
            if (Cookies.get('token') === undefined) {
              alert('You must be logged in to view reviews of a listing');
            } else {
              navigate(`/reviews/${openedPopover}`);
            }
          }}
        >
          {ratingSpread[5] === 0 ? (
            <div style={linkStyle}>No reviews yet</div>
          ) : (
            <div style={linkStyle}>
              {`${svg} out of 5 from ${ratingSpread[5]} ${
                ratingSpread[5] === 1 ? 'review' : 'reviews'
              }`}
            </div>
          )}
          {showHover(ratingSpread)}
        </div>
      </Popover>
    </Box>
  );
};

HoverRating.propTypes = {
  /** The id of the listing */
  id: PropTypes.node.isRequired,
  /** The average rating of the listing */
  svg: PropTypes.node.isRequired,
  /** The number of ratings at each value and the total number of ratings */
  ratingSpread: PropTypes.array.isRequired,
};

export default HoverRating;
