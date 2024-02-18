import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import PropTypes from 'prop-types';
import { apiRequest } from '../Api';
import { useNavigate } from 'react-router-dom';
import PrimaryButton from './PrimaryButton';
import { InputLabel, NativeSelect, TextField } from '@material-ui/core';
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

const MakeBookingModal = (props) => {
  const navigate = useNavigate();
  const availabilities = props.availabilities;
  const price = props.price;

  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState('');
  const [startTime, setStartTime] = React.useState('');
  const [startHour, setStartHour] = React.useState('12');
  const [startMinute, setStartMinute] = React.useState('0');
  const [startAMPM, setStartAMPM] = React.useState('AM');
  const [endTime, setEndTime] = React.useState('');
  const [endHour, setEndHour] = React.useState('12');
  const [endMinute, setEndMinute] = React.useState('0');
  const [endAMPM, setEndAMPM] = React.useState('AM');
  const [submit, setSubmit] = React.useState(false);
  const [totalCost, setTotalCost] = React.useState(false);
  const [serviceFee, setServiceFee] = React.useState(false);
  const [total, setTotal] = React.useState(false);
  const [cardNumber, setCardNumber] = React.useState('');
  const [cardPin, setCardPin] = React.useState('');
  const [expMonth, setExpMonth] = React.useState('0');
  const [expYear, setExpYear] = React.useState('2023');
  const [streak, setStreak] = React.useState(false);
  const [clicked, setClicked] = React.useState(false);
  const [emojiList, setEmojiList] = React.useState(false);

  /** Open the modal */
  const handleOpen = () => {
    setOpen(true);
  };

  /** Close the modal */
  const handleClose = () => {
    setOpen(false);
  };

  /** Set the requested booking date and time whenever it changes  */
  React.useEffect(() => {
    setSubmit(checkAvailability());
  }, [date, startTime, endTime]);

  /**  Get current puzzle streak */
  React.useEffect(() => {
    apiRequest('puzzle/streak', undefined, 'GET')
      .then((data) => {
        if (data.streak >= 7) {
          setStreak(true);
        }
      })
      .catch((error) => console.log(error));
  }, []);

  /**
   * Check the booking details are valid.
   * Set the cost of the booking if they are.
   */
  const checkAvailability = () => {
    if (!date) {
      return false;
    }
    if (startTime - endTime >= 0) {
      return false;
    }
    let inRange = false;
    for (const availability of availabilities) {
      if (date >= availability.start_date && date <= availability.end_date) {
        if (startTime - availability.start_time >= 0) {
          if (endTime - availability.end_time <= 0) {
            inRange = true;
          }
        }
      }
    }
    if (inRange) {
      setTotalCost(((price * (endTime - startTime)) / 3600000).toFixed(2));
      setServiceFee((((price * (endTime - startTime)) / 3600000) * 0.15).toFixed(2));
      setTotal((((price * (endTime - startTime)) / 3600000) * 1.15).toFixed(2));
    }
    return inRange;
  };

  /** Check the card details and send the booking to the backend  */
  const makeBooking = () => {
    const data = {
      date: date,
      start_time: startTime,
      end_time: endTime,
    };
    if (
      cardNumber === '' ||
      cardPin === '' ||
      cardNumber.length < 15 ||
      cardPin.length < 3 ||
      cardNumber.length > 16 ||
      cardPin.length > 4
    ) {
      alert('Enter valid credit card details to make a booking');
      return;
    }
    if (!(/^\d+$/.test(cardNumber) || /^\d+$/.test(cardPin))) {
      alert('Your credit card number and CVV can only contain numeric digits');
      return;
    }
    if (cardNumber.length === 16 && cardPin.length !== 3) {
      alert('Invalid CVV entered');
      return;
    }
    if (cardNumber.length === 15 && cardPin.length !== 4) {
      alert('For an Amex card the CVV should contain 4 digits');
      return;
    }
    const d = new Date(Date.now());
    if (expYear === '2023' && parseInt(expMonth) <= d.getMonth()) {
      alert('Your credit card has expired');
      return;
    }
    const emojis = [];
    // Catch is if the user that makes the booking is the one that owns the booking
    apiRequest(`listing/${props.id}/book`, data, 'POST')
      .then(async () => {
        alert('Booking request sent');
        await apiRequest('badge/add_badge_to_current_user?type_id=5', undefined, 'PUT')
          .then(() => {
            emojis.push('📚');
          })
          .catch(() => {});
        if (date - Date.now() > 7 * 24 * 60 * 60 * 1000) {
          await apiRequest('badge/add_badge_to_current_user?type_id=6', undefined, 'PUT')
            .then(() => {
              emojis.push('⏳');
            })
            .catch(() => {});
        }
        if (streak) {
          await apiRequest('badge/add_badge_to_current_user?type_id=12', undefined, 'PUT')
            .then(() => {
              emojis.push('🔥');
            })
            .catch(() => {});
        }
        const selected_date = new Date(date);
        if (selected_date.getDate() === 15 && selected_date.getMonth() === 9) {
          await apiRequest('badge/add_badge_to_current_user?type_id=20', undefined, 'PUT')
            .then(() => {
              emojis.push('🎉');
            })
            .catch(() => {});
        }
        setEmojiList(emojis, setClicked(true));
        handleClose();
      })
      .catch((err) => alert(err.detail));
  };

  /** Convert the start time to a 12-hour format */
  React.useEffect(() => {
    let final_hour = Number(startHour);

    if (startAMPM === 'AM') {
      if (final_hour === 12) {
        final_hour = 0;
      }
    } else {
      if (final_hour !== 12) {
        final_hour += 12;
      }
    }

    const d = new Date(0);
    d.setHours(final_hour, Number(startMinute));
    setStartTime(d.getTime());
    return;
  }, [startHour, startMinute, startAMPM, open]);

  /** Convert the end time to a 12-hour format */
  React.useEffect(() => {
    let final_hour = Number(endHour);

    const d = new Date(0);

    if (endAMPM === 'AM') {
      if (final_hour === 12) {
        d.setDate(2);
        final_hour = 0;
      }
    } else {
      if (final_hour !== 12) {
        final_hour += 12;
      }
    }

    d.setHours(final_hour, Number(endMinute));
    setEndTime(d.getTime());

    return;
  }, [endHour, endMinute, endAMPM, open]);

  /** Component that accepts the user input of a start time */
  const generateStartTime = () => {
    const hours = Array.from(new Array(12), (val, index) => index + 1);
    const minutes = Array.from(new Array(4), (val, index) => String(index * 15).padStart(2, '0'));

    return (
      <>
        <InputLabel>Start Time</InputLabel>
        <Box
          component="form"
          style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}
        >
          <NativeSelect
            id="Start Hour"
            value={startHour}
            label="Start Hour"
            onChange={(e) => setStartHour(e.target.value)}
            style={{ width: '30%' }}
          >
            {hours.map((hour) => {
              return (
                <option value={hour} key={`select_start_hour_${hour}`}>
                  {hour}
                </option>
              );
            })}
          </NativeSelect>
          <NativeSelect
            id="Start Minute"
            value={startMinute}
            label="Start minute"
            style={{ width: '30%' }}
            onChange={(e) => setStartMinute(e.target.value)}
          >
            {minutes.map((minute) => {
              return (
                <option value={minute} key={`select_start_minute_${minute}`}>
                  {minute}
                </option>
              );
            })}
          </NativeSelect>
          <NativeSelect
            id="Start AMPM"
            value={startAMPM}
            label="Start AM or PM"
            style={{ width: '30%' }}
            onChange={(e) => setStartAMPM(e.target.value)}
          >
            <option value={'AM'} key={'start_am'}>
              AM
            </option>
            <option value={'PM'} key={'start_pm'}>
              PM
            </option>
          </NativeSelect>
        </Box>
      </>
    );
  };

  /** Component that accepts the user input of an end time */
  const generateEndTime = () => {
    const hours = Array.from(new Array(12), (val, index) => index + 1);
    const minutes = Array.from(new Array(4), (val, index) => String(index * 15).padStart(2, '0'));

    return (
      <>
        <InputLabel>End Time</InputLabel>
        <Box
          component="form"
          style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}
        >
          <NativeSelect
            id="End Hour"
            value={endHour}
            label="End Hour"
            style={{ width: '30%' }}
            onChange={(e) => setEndHour(e.target.value)}
          >
            {hours.map((hour) => {
              return (
                <option value={hour} key={`select_end_hour_${hour}`}>
                  {hour}
                </option>
              );
            })}
          </NativeSelect>
          <NativeSelect
            id="End Minute"
            value={endMinute}
            label="End minute"
            style={{ width: '30%' }}
            onChange={(e) => setEndMinute(e.target.value)}
          >
            {minutes.map((minute) => {
              return (
                <option value={minute} key={`select_end_minute_${minute}`}>
                  {minute}
                </option>
              );
            })}
          </NativeSelect>
          <NativeSelect
            id="End AMPM"
            value={endAMPM}
            label="End AM or PM"
            style={{ width: '30%' }}
            onChange={(e) => setEndAMPM(e.target.value)}
          >
            <option value={'AM'} key={'end_am'}>
              AM
            </option>
            <option value={'PM'} key={'end_pm'}>
              PM
            </option>
          </NativeSelect>
        </Box>
      </>
    );
  };

  /** Component that returns a select of the 20 years from today */
  const getYears = () => {
    const year = new Date().getFullYear();
    const years = Array.from(new Array(20), (val, index) => index + year);

    return (
      <>
        <NativeSelect
          id="year"
          value={expYear}
          label="Year"
          onChange={(e) => setExpYear(e.target.value)}
        >
          {years.map((year) => {
            return (
              <option value={year} key={`select_year_${year}`}>
                {year}
              </option>
            );
          })}
        </NativeSelect>
        <br />
      </>
    );
  };

  return (
    <div>
      <PrimaryButton name="Make Booking" onClick={handleOpen} />
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <TextField
            id="date"
            label="Date"
            type="date"
            InputLabelProps={{
              shrink: true,
            }}
            onChange={(e) => {
              setDate(Date.parse(e.target.value));
            }}
            defaultValue={new Date(date).toLocaleDateString('fr-CA')}
          />
          <br />
          {generateStartTime()}
          {generateEndTime()}
          <div>For an all day booking, enter both times as 12:00 AM</div>
          <br />
          {submit && (
            <>
              <div> Cost of Space: ${totalCost} </div>
              <div>
                Service Fee (15%): ${streak ? '0 (puzzle streak discount)' : `${serviceFee}`}{' '}
              </div>
              <div> Total Cost: ${streak ? `${totalCost}` : `${total}`} </div>
              <br />
              <TextField
                id="card-number"
                label="Credit Card Number"
                type="text"
                InputLabelProps={{
                  shrink: true,
                }}
                onChange={(e) => setCardNumber(e.target.value)}
              />
              <br />
              <InputLabel>Expiry</InputLabel>
              <NativeSelect
                id="month"
                value={expMonth}
                label="Month"
                onChange={(e) => setExpMonth(e.target.value)}
              >
                <option key={'select_month_1'} value={1}>
                  Jan
                </option>
                <option key={'select_month_2'} value={2}>
                  Feb
                </option>
                <option key={'select_month_3'} value={3}>
                  Mar
                </option>
                <option key={'select_month_4'} value={4}>
                  Apr
                </option>
                <option key={'select_month_5'} value={5}>
                  May
                </option>
                <option key={'select_month_6'} value={6}>
                  Jun
                </option>
                <option key={'select_month_7'} value={7}>
                  Jul
                </option>
                <option key={'select_month_8'} value={8}>
                  Aug
                </option>
                <option key={'select_month_9'} value={9}>
                  Sep
                </option>
                <option key={'select_month_10'} value={10}>
                  Oct
                </option>
                <option key={'select_month_11'} value={11}>
                  Nov
                </option>
                <option key={'select_month_12'} value={12}>
                  Dec
                </option>
              </NativeSelect>
              <br />
              {getYears()}
              <TextField
                id="card-cvv"
                label="CVV"
                type="text"
                defaultValue={cardPin}
                InputLabelProps={{
                  shrink: true,
                }}
                onChange={(e) => setCardPin(e.target.value)}
              />
              <br />
            </>
          )}
          <Button
            onClick={makeBooking}
            disabled={!submit}
            id="submit-booking"
            aria-label="Submit Booking"
            variant="contained"
            color="primary"
          >
            Submit Booking
          </Button>
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

MakeBookingModal.propTypes = {
  /** Array of availability dicts */
  availabilities: PropTypes.array.isRequired,
  /** Cost per hour of the property */
  price: PropTypes.number.isRequired,
  /** id of the listing */
  id: PropTypes.number.isRequired,
};

export default MakeBookingModal;
