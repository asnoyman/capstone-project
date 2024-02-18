import * as React from 'react';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import { Rating } from '@mui/material';
import { Checkbox, FormControlLabel, TextField, Typography } from '@material-ui/core';
import { apiRequest } from '../Api';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';
import ShootEmojis from './ShootEmojis';

/** css of the Box */
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  minWidth: '250px',
  padding: '20px',
  placeContent: 'center',
  display: 'flex',
  flexDirection: 'column',
};

const LeaveReviewModal = ({ listingId }) => {
  const [open, setOpen] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [comment, setComment] = React.useState('');
  const [anonymous, setAnonymous] = React.useState(false);
  const [alreadyLeft, setAlreadyLeft] = React.useState(false);
  const [clicked, setClicked] = React.useState(false);
  const [emojiList, setEmojiList] = React.useState(false);
  const navigate = useNavigate();

  /** Opens the modal */
  const handleOpen = () => {
    setOpen(true);
    setRating(0);
    setComment('');
  };

  /** Closes the modal */
  const handleClose = () => {
    setOpen(false);
  };

  /** Get the existing review information if it exists when the modal opens */
  React.useEffect(() => {
    apiRequest(`listing/${listingId}/review`, undefined, 'GET')
      .then((review) => {
        setRating(review.rating);
        setComment(review.review);
        setAnonymous(review.anonymous);
        setAlreadyLeft(true);
      })
      .catch(() => {
        setAlreadyLeft(false);
      });
  }, [listingId, open]);

  /** Check and send the updated review to the back end */
  const submitReview = async () => {
    if (rating === 0) {
      alert('Rating must be a star value between 1 and 5');
      return;
    }
    const data = {
      rating,
      review: comment,
      anonymous,
    };

    const emojis = [];
    await apiRequest(`listing/${listingId}/review`, data, 'PUT')
      .then(async () => {
        alert('Review successfully submitted');
        await apiRequest('badge/add_badge_to_current_user?type_id=7', undefined, 'PUT')
          .then(() => {
            emojis.push('📝');
          })
          .catch(() => {});
        if (comment !== '') {
          await apiRequest('badge/add_badge_to_current_user?type_id=8', undefined, 'PUT')
            .then(() => {
              emojis.push('✍️');
            })
            .catch(() => {});
        }
        if (!anonymous) {
          await apiRequest('badge/add_badge_to_current_user?type_id=9', undefined, 'PUT')
            .then(() => {
              emojis.push('🕵️');
            })
            .catch(() => {});
        }
        if (rating === 5) {
          await apiRequest('badge/add_badge_to_current_user?type_id=10', undefined, 'PUT')
            .then(() => {
              emojis.push('💯');
            })
            .catch(() => {});
        }
        let d = new Date(Date.now());
        if (d.getHours() % 12 === 11 && d.getMinutes() === 11) {
          await apiRequest('badge/add_badge_to_current_user?type_id=19', undefined, 'PUT')
            .then(() => {
              emojis.push('🌠');
            })
            .catch(() => {});
        }
      })
      .catch((error) => {
        console.log(error.detail);
      });
    setEmojiList(emojis, setClicked(true));
    handleClose();
  };

  /** Delete the review */
  const deleteReview = () => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      apiRequest(`listing/${listingId}/review`, undefined, 'DELETE')
        .then(() => {
          navigate(0);
        })
        .catch((error) => {
          console.log(error.detail);
        });
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <PrimaryButton name={alreadyLeft ? 'Edit Review' : 'Add Review'} onClick={handleOpen} />
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography component="legend">Select Rating</Typography>
          <Rating
            name="star-rating"
            value={rating}
            onChange={(value, newValue) => {
              setRating(newValue);
            }}
          />
          <br />
          <TextField
            id="review-comment"
            label="Add comment (Optional)"
            variant="outlined"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <br />
          <FormControlLabel
            id="leave-anonymous"
            label="Leave review anonymously"
            control={<Checkbox />}
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
          />
          <PrimaryButton
            name={alreadyLeft ? 'Edit Review' : 'Submit Review'}
            onClick={submitReview}
          />
          {alreadyLeft && <SecondaryButton name="Delete Review" onClick={deleteReview} />}
        </Box>
      </Modal>
      {clicked && (
        <ShootEmojis
          emojis={emojiList}
          complete={() => {
            setClicked(false);
            navigate(0);
          }}
        />
      )}
    </div>
  );
};

LeaveReviewModal.propTypes = {
  /** the id of the listing being reviewed */
  listingId: PropTypes.node.isRequired,
};

export default LeaveReviewModal;
