import * as React from 'react';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import { TextField } from '@material-ui/core';
import { apiRequest } from '../Api';
import { useNavigate } from 'react-router-dom';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';
import ShootEmojis from './ShootEmojis';

// The css for Box
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

const AddBankDetailsModal = () => {
  const [open, setOpen] = React.useState(false);
  const [bsb, setBsb] = React.useState('');
  const [accountNumber, setAccountNumber] = React.useState('');
  const [alreadyLeft, setAlreadyLeft] = React.useState(false);
  const [clicked, setClicked] = React.useState(false);
  const navigate = useNavigate();

  /** Opens the modal */
  const handleOpen = () => {
    setOpen(true);
    setBsb('');
    setAccountNumber('');
  };

  /** Closes the modal */
  const handleClose = () => {
    setOpen(false);
  };

  // Fetch the users payment info
  React.useEffect(() => {
    apiRequest(`user/payment/account`, undefined, 'GET')
      .then((account) => {
        setBsb(account.bsb);
        setAccountNumber(account.account_number);
        setAlreadyLeft(true);
      })
      .catch((error) => {});
  }, [open]);

  /**
   * Chech that the acc and bsb are valid and send them to the back end
   */
  const submitDetails = () => {
    if (bsb === '' || accountNumber === '' || !/^\d+$/.test(bsb) || !/^\d+$/.test(accountNumber)) {
      alert('Enter a valid bsb and account number');
      return;
    }
    const data = {
      bsb,
      account_number: accountNumber,
    };

    apiRequest(`user/payment/account`, data, 'PUT')
      .then(() => {
        alert('Bank details successfully submitted');
        apiRequest('badge/add_badge_to_current_user?type_id=15', undefined, 'PUT')
          .then(() => {
            handleClose();
            setClicked(true);
          })
          .catch(() => {
            handleClose();
            navigate(0);
          });
      })
      .catch((error) => {
        alert(error.detail[0].msg);
      });
  };

  /**
   * Deletes the user's bank details from the system
   */
  const deleteDetails = () => {
    if (window.confirm('Are you sure you want to delete your bank details?')) {
      apiRequest(`user/payment/account`, undefined, 'DELETE')
        .then(() => {
          navigate(0);
        })
        .catch((error) => {
          console.log(error.detail);
        });
    }
  };

  return (
    <div>
      <PrimaryButton name="Edit Bank Details" onClick={handleOpen} />
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <TextField
            id="bsb"
            label="BSB"
            variant="outlined"
            required
            value={bsb}
            InputLabelProps={{
              shrink: bsb !== '',
            }}
            onChange={(e) => setBsb(e.target.value)}
          />
          <br />
          <TextField
            id="accountNumber"
            label="Account Number"
            variant="outlined"
            required
            value={accountNumber}
            InputLabelProps={{
              shrink: accountNumber !== '',
            }}
            onChange={(e) => setAccountNumber(e.target.value)}
          />
          <br />
          <PrimaryButton name="Submit Bank Details" onClick={submitDetails} />
          {alreadyLeft && <SecondaryButton name="Delete Bank Details" onClick={deleteDetails} />}
        </Box>
      </Modal>
      {clicked && (
        <ShootEmojis
          emojis={['💵']}
          complete={() => {
            setClicked(false);
            navigate(0);
          }}
        />
      )}
    </div>
  );
};

export default AddBankDetailsModal;
