import React from 'react';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../Api';
import Cookies from 'js-cookie';
import BookingsTable from '../components/BookingsTable';

const BookedListings = () => {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = React.useState(false);

  /** If the user isn't logged in , navigate to the home page */
  React.useEffect(() => {
    if (Cookies.get('token') !== undefined) {
      apiRequest('token/user', undefined, 'POST')
        .then(() => setLoggedIn(true))
        .catch(() => {
          Cookies.remove('token');
          navigate('/');
          navigate(0);
        });
    } else {
      navigate('/');
      navigate(0);
    }
    window.scrollTo(0, 0);
  }, [Cookies.get('token'), navigate]);

  localStorage.setItem('page', 'Bookings');
  document.title = 'Bookings';

  return (
    loggedIn && (
      <>
        <Header />
        <br />
        <div style={{ paddingLeft: '10px' }}>Upcoming Bookings</div>
        <BookingsTable isPast={false}></BookingsTable>
        <div style={{ paddingLeft: '10px' }}>Past Bookings</div>
        <BookingsTable isPast={true}></BookingsTable>
      </>
    )
  );
};

export default BookedListings;
