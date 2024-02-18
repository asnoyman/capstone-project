import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import { InputLabel, NativeSelect, TextField } from '@material-ui/core';
import { apiRequest } from '../Api';
import PropTypes from 'prop-types';
import SecondaryButton from './SecondaryButton';
import PrimaryButton from './PrimaryButton';
import { IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import ShootEmojis from './ShootEmojis';

// The css for Box
const boxStyle = {
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

const AddAvailabilitiesModal = ({ id, availabilities }) => {
  const navigate = useNavigate();

  const [open, setOpen] = React.useState(false);
  const [dates, setDates] = React.useState([]);

  // Open the modal
  const handleOpen = () => {
    setOpen(true);
    // Show the existing availabilities, if there are any
    if (availabilities !== undefined) {
      setDates(availabilities);
    }
  };

  // Close the modal
  const handleClose = (e) => {
    e.stopPropagation();
    setOpen(false);
  };

  const [startDate, setStartDate] = React.useState(null);
  const [endDate, setEndDate] = React.useState(null);
  const [startTime, setStartTime] = React.useState(null);
  const [startHour, setStartHour] = React.useState('12');
  const [startMinute, setStartMinute] = React.useState('0');
  const [startAMPM, setStartAMPM] = React.useState('AM');
  const [endTime, setEndTime] = React.useState(null);
  const [endHour, setEndHour] = React.useState('12');
  const [endMinute, setEndMinute] = React.useState('0');
  const [endAMPM, setEndAMPM] = React.useState('AM');
  const [live, setLive] = React.useState(false);
  const [clicked, setClicked] = React.useState(false);

  // On page load, get the availability information
  React.useEffect(() => {
    apiRequest(`listing/${id}/availability`, undefined, 'GET')
      .then((json) => {
        setLive(json.length !== 0);
      })
      .catch((error) => {
        console.log(error.detail);
      });
  }, []);

  /**
   * Checks if an availability range is valid and adds it to the dates list
   */
  const addDate = () => {
    if (!startDate || !endDate) {
      alert('Start and end dates and times are all required to create an availability range');
      return;
    }
    if (startDate - new Date(Date.now()).setHours(0, 0, 0, 0) < 0) {
      alert('Start date must be today or later');
      return;
    }
    if (startDate - endDate > 0) {
      alert('The end date must be after the the start date.');
      return;
    }
    if (startTime - endTime >= 0) {
      alert('The end time must be after the the start time.');
      return;
    }

    setDates([
      ...dates,
      { start_date: startDate, end_date: endDate, start_time: startTime, end_time: endTime },
    ]);
    setStartHour('12');
    setStartMinute('0');
    setStartAMPM('AM');
    setEndHour('12');
    setEndMinute('0');
    setEndAMPM('AM');
  };

  /**
   * Converts the date list to a list of divs, formatted to be shown in the modal
   * @returns a list of divs
   */
  const generateDates = () => {
    const dateList = [];
    for (const [i, date] of dates.entries()) {
      dateList.push(
        <div
          name={`availabilities${i}`}
          key={`${date.start_date}-${date.end_date}-${date.start_time}-${date.end_time}`}
        >
          Start Date: {new Date(date.start_date).toLocaleDateString('en-AU')} - End Date:{' '}
          {new Date(date.end_date).toLocaleDateString('en-AU')}
          <br />
          Start Time: {new Date(date.start_time).getHours()}:
          {String(new Date(date.start_time).getMinutes()).padStart(2, '0')} - End Time:{' '}
          {new Date(date.end_time).getHours()}:
          {String(new Date(date.end_time).getMinutes()).padStart(2, '0')}
          <IconButton
            aria-label="delete"
            onClick={() => {
              deleteAvailability(date);
            }}
          >
            <DeleteIcon />
          </IconButton>
        </div>
      );
    }
    if (dateList.length === 0) {
      dateList.push(<div>No current availabilites.</div>);
    }
    return dateList;
  };

  /**
   * Send all of the dates in the Dates list to the back end.
   * Closes the modal.
   */
  const goLive = () => {
    apiRequest(`listing/${id}/availability`, dates, 'PUT')
      .then(() => {
        setLive(dates.length !== 0);
        apiRequest('badge/add_badge_to_current_user?type_id=4', undefined, 'PUT')
          .then(() => {
            setClicked(true);
            setOpen(false);
          })
          .catch(() => {
            setOpen(false);
            navigate(0);
          });
      })
      .catch((error) => {
        console.log(error.detail);
      });
  };

  /**
   * Deletes a date object from the Dates list
   * @param {*} date
   */
  const deleteAvailability = (date) => {
    if (window.confirm('Are you sure you want to delete this avilability slot?')) {
      setDates(dates.filter((dateIter) => dateIter !== date));
    }
  };

  // Converts a 24 hour start time to 12 hour format
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

  // Converts a 24 hour end time to 12 hour format
  React.useEffect(() => {
    let final_hour = Number(endHour);

    const d = new Date(0);

    if (endAMPM === 'AM') {
      if (final_hour === 12) {
        final_hour = 0;
        d.setDate(2);
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
    const hours = Array.from(new Array(12), (_, index) => index + 1);
    const minutes = Array.from(new Array(4), (_, index) => String(index * 15).padStart(2, '0'));

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

  /**
   * Component that accepts the user input of an end time
   */
  const generateEndTime = () => {
    const hours = Array.from(new Array(12), (_, index) => index + 1);
    const minutes = Array.from(new Array(4), (_, index) => String(index * 15).padStart(2, '0'));

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

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <SecondaryButton
        name={live ? 'Edit Availabilities' : 'Add Availabilities'}
        onClick={handleOpen}
      />
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={boxStyle}>
          {generateDates()}
          <TextField
            id="start-date"
            label="Start Date"
            type="date"
            InputLabelProps={{
              shrink: true,
            }}
            onChange={(e) => setStartDate(Date.parse(e.target.value))}
          />
          <TextField
            id="end-date"
            label="End Date"
            type="date"
            InputLabelProps={{
              shrink: true,
            }}
            onChange={(e) => setEndDate(Date.parse(e.target.value))}
          />
          {generateStartTime()}
          {generateEndTime()}
          <div>For all day availability, enter both times as 12:00 AM</div>
          <br />
          <Button
            id="add-date-button"
            aria-label="Add current Range"
            variant="outline"
            color="primary"
            onClick={addDate}
          >
            Add Current Range
          </Button>
          <PrimaryButton name="Submit All Dates" onClick={goLive} />
        </Box>
      </Modal>
      {clicked && (
        <ShootEmojis
          emojis={['📅']}
          complete={() => {
            setClicked(false);
            navigate(0);
          }}
        />
      )}
    </div>
  );
};

AddAvailabilitiesModal.propTypes = {
  /** The id of the space having availabilities edited  */
  id: PropTypes.number.isRequired,
  /** The availabilities object of the space having availabilities edited  */
  availabilities: PropTypes.object.isRequired,
};

export default AddAvailabilitiesModal;
