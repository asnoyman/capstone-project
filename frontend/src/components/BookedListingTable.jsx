import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import PropTypes from 'prop-types';
import '../App.css';
import { useNavigate } from 'react-router-dom';
import { IconButton, LinearProgress } from '@material-ui/core';
import CancelIcon from '@mui/icons-material/Cancel';
import { apiRequest } from '../Api';
import LeaveReviewModal from './LeaveReviewModal';

const BookedListingTable = ({ isPast }) => {
  const navigate = useNavigate();
  const [listings, setListings] = React.useState([]);
  const [showSpinner, setShowSpinner] = React.useState(true);

  /** The css for the Table */
  const table = {
    marginTop: '50px',
    padding: '0 10px 10px 10px',
    margin: '10px',
    maxHeight: '39vh',
    overflowY: 'scroll',
  };

  /** The css for the thumbnail */
  const thumbnailStyle = {
    maxWidth: '170px',
    maxHeight: '140px',
    objectFit: 'contain',
  };

  /** Set listingData to be a list with the information about all of the listings the user has booked */
  React.useEffect(() => {
    const getRows = async () => {
      const json = await apiRequest('user/booked', undefined, 'GET').catch((error) => {
        console.log(error);
        setShowSpinner(false);
        navigate('/');
        navigate(0);
      });
      const bookings = isPast ? json.past_bookings : json.upcoming_bookings;
      // Sort the bookings by date, then start time
      bookings.sort((a, b) => {
        if (a.date === b.date) {
          return new Date(a.start_time) - new Date(b.start_time);
        } else {
          return new Date(a.date) - new Date(b.date);
        }
      });
      // Unpack the listing date from the bookings promise
      const listingData = await Promise.all(
        bookings
          .filter((booking) => booking.listing_id !== null)
          .map(async (booking) => {
            const listing = await apiRequest(
              `listing/${booking.listing_id}`,
              undefined,
              'GET'
            ).catch((error) => {
              console.log(error);
              setShowSpinner(false);
              navigate('/');
              navigate(0);
            });
            return {
              bookingId: `${booking.id}`,
              listingId: `${listing.id}`,
              title: listing.title,
              thumbnail: listing.images[0].data,
              address: listing.address,
              date: `${new Date(booking.date).toLocaleDateString('en-AU')}`,
              startTime: `${new Date(booking.start_time).getHours()}:${String(
                new Date(booking.start_time).getMinutes()
              ).padStart(2, '0')}`,
              endTime: `${new Date(booking.end_time).getHours()}:${String(
                new Date(booking.end_time).getMinutes()
              ).padStart(2, '0')}`,
              price: `$${(
                ((booking.end_time - booking.start_time) * listing.price_per_hour) /
                3600000
              ).toFixed(2)}`,
            };
          })
      );
      setListings(listingData);
      setShowSpinner(false);
    };
    getRows();
  }, [isPast, navigate]);

  /**
   * Cancels the booking for a user with id = bookingId
   */
  const cancelBooking = (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      apiRequest(`booking/${bookingId}`, undefined, 'DELETE')
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
      {showSpinner && <LinearProgress id="loading-bar" />}
      <Paper style={table}>
        <Table>
          <TableHead>
            <TableRow
              style={{
                position: 'sticky',
                top: 0,
                backgroundColor: 'white',
                zIndex: 1001,
              }}
            >
              <TableCell key="title">Title</TableCell>
              <TableCell key="thumbnail">Thumbnail</TableCell>
              <TableCell key="address">Address</TableCell>
              <TableCell key="date">Date</TableCell>
              <TableCell key="start time">Start Time</TableCell>
              <TableCell key="end time">End Time</TableCell>
              <TableCell key="price">Price ($)</TableCell>
              {isPast ? (
                <TableCell key="review">Add Review</TableCell>
              ) : (
                <TableCell key="cancel">Cancel Booking</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {listings.length === 0 ? (
              <TableRow>
                <TableCell>No {isPast ? 'past' : 'upcoming'} bookings</TableCell>
              </TableRow>
            ) : (
              listings.map(
                ({
                  bookingId,
                  listingId,
                  title,
                  address,
                  thumbnail,
                  date,
                  startTime,
                  endTime,
                  price,
                }) => (
                  <TableRow
                    key={bookingId}
                    onClick={() => {
                      navigate(`/view_listing/${listingId}`);
                    }}
                    hover={true}
                    style={{ cursor: 'pointer' }}
                  >
                    <TableCell key={`title${bookingId}`}>{title}</TableCell>
                    <TableCell key={`thumbnail${bookingId}`}>
                      {!thumbnail.includes('www.youtube.com') ? (
                        <img
                          src={thumbnail}
                          alt={`thumbnail of property ${title}`}
                          style={thumbnailStyle}
                        />
                      ) : (
                        <iframe
                          bookingId="video"
                          width="170"
                          height="140"
                          src={thumbnail}
                          title={`youtube${bookingId}`}
                          allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      )}
                    </TableCell>
                    <TableCell key={`address${bookingId}`}>{address}</TableCell>
                    <TableCell key={`date${bookingId}`}>{date}</TableCell>
                    <TableCell key={`startTime${bookingId}`}>{startTime}</TableCell>
                    <TableCell key={`endTime${bookingId}`}>{endTime}</TableCell>
                    <TableCell key={`price${bookingId}`}>{price}</TableCell>
                    {isPast ? (
                      <TableCell>
                        <LeaveReviewModal listingId={listingId} />
                      </TableCell>
                    ) : (
                      <TableCell key={`cancel${bookingId}`}>
                        <IconButton
                          aria-label="cancel"
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelBooking(bookingId);
                          }}
                        >
                          <CancelIcon />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                )
              )
            )}
          </TableBody>
        </Table>
      </Paper>
    </div>
  );
};

BookedListingTable.propTypes = {
  /** A bool that is true if the table contains past books, and false if it is future bookings */
  isPast: PropTypes.bool.isRequired,
};

export default BookedListingTable;
