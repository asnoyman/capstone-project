import React from 'react';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../Api';
import { Button, LinearProgress } from '@material-ui/core';
import Cookies from 'js-cookie';
import HostedListingTable from '../components/HostedListingTable';

const HostedListings = () => {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = React.useState(false);

  /** Check if the user is logged in, if not navigate to the home page */
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

  const [showSpinner, setShowSpinner] = React.useState(true);
  localStorage.setItem('page', 'Hosted Listings');
  document.title = 'Hosted Listings';

  const listingData = [];
  /**
   * @returns a list of listings that the user has created
   */
  const getRows = async () => {
    const json = await apiRequest('listing/user', undefined, 'GET').catch((error) => {
      setShowSpinner(false);
      console.log(error);
    });
    await json.forEach((listing) => {
      const ratingSpread = [0, 0, 0, 0, 0, 0];
      for (const review of listing.reviews.reviews) {
        ratingSpread[review.rating - 1] += 1;
        ratingSpread[5] += 1;
      }
      listingData.push({
        id: listing.id,
        title: listing.title,
        length: listing.length,
        width: listing.width,
        height: listing.height,
        thumbnail: listing.images[0].data,
        images: listing.images,
        svg: listing.reviews.aggregate_rating,
        ratingSpread,
        price: listing.price_per_hour,
        address: listing.address,
        availabilities: listing.availabilities,
      });
    });
    setShowSpinner(false);
    return listingData;
  };

  /** Navigate to the create listing page */
  const createListing = () => {
    apiRequest('user/payment/account', undefined, 'GET')
      .then(() => {
        navigate('/create_listing');
      })
      .catch(() => {
        alert('You must add your bank details to your profile before creating a listing');
      });
  };

  return (
    loggedIn && (
      <>
        <Header />
        {showSpinner && <LinearProgress id="loading-bar" />}
        <br />
        <Button
          aria-label="Create New Listing (Form)"
          id="create-listing-button"
          variant="contained"
          color="primary"
          onClick={createListing}
          style={{ margin: '10px' }}
        >
          Create New Listing
        </Button>
        <Button
          aria-label="View Bookings"
          id="view-bookings-button"
          variant="contained"
          color="primary"
          onClick={() => navigate('/bookings')}
        >
          View Bookings
        </Button>
        <HostedListingTable data={getRows()}></HostedListingTable>
      </>
    )
  );
};

export default HostedListings;
