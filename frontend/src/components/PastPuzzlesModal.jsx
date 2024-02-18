import * as React from 'react';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import { TextField } from '@material-ui/core';
import { apiRequest } from '../Api';
import { useNavigate } from 'react-router-dom';
import PrimaryButton from './PrimaryButton';

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

const PastPuzzlesModal = () => {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState();
  const [status, setStatus] = React.useState('');

  /** Opens the modal */
  const handleOpen = () => {
    setOpen(true);
  };

  /** Closes the modal */
  const handleClose = () => {
    setOpen(false);
    setStatus('');
    setDate(undefined);
  };

  React.useEffect(() => {
    if (date === undefined || date > Date.now()) {
      setStatus('');
    } else {
      apiRequest(`puzzle/submission/${date}`)
        .then((json) => {
          if (JSON.stringify(json.puzzle) === JSON.stringify(json.submission)) {
            setStatus('Start');
          } else {
            setStatus('Resume');
          }
        })
        .catch((err) => {
          console.log(err.detail);
        });
    }
  }, [date]);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <PrimaryButton name="View Past Puzzles" onClick={handleOpen} />
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <h3>Select the date of the puzzle you want to do</h3>
          <TextField
            id="date"
            label="Date"
            type="date"
            defaultValue=""
            inputProps={{ max: new Date(Date.now()).toLocaleDateString('sv-SE') }}
            InputLabelProps={{
              shrink: true,
            }}
            onChange={(e) =>
              e.target.value !== '' ? setDate(Date.parse(e.target.value)) : setDate(undefined)
            }
          />
          {status !== '' && (
            <PrimaryButton
              name={status}
              onClick={() => {
                navigate(`/puzzles/${date}`);
                navigate(0);
              }}
            />
          )}
        </Box>
      </Modal>
    </div>
  );
};

export default PastPuzzlesModal;
