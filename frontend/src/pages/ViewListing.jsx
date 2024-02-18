import * as React from 'react';
import Header from '../components/Header';
import '../App.css';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../Api';
import { LinearProgress } from '@material-ui/core';
import CentredContainer from '../components/CentredContainer';
import Cookies from 'js-cookie';
import Carousel from '../components/Carousel';
import MakeBookingModal from '../components/MakeBookingModal';
import HoverRating from '../components/HoverRating';
import SecondaryButton from '../components/SecondaryButton';

const ViewListing = () => {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [permission, setPermission] = React.useState(false);

  /** If the user is not logged in, navigate to the home page */
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
  localStorage.setItem('page', 'View Listing');
  document.title = 'View Listing';

  const [listingInfo, setListingInfo] = React.useState(null);
  const [reviewInfo, setReviewInfo] = React.useState({ reviews: [] });
  const [upcomingAvailabilities, setUpcomingAvailabilities] = React.useState(null);
  const listingId = window.location.href.split('/')[4];

  /** Load the listing information */
  React.useEffect(() => {
    apiRequest(`listing/${listingId}`, undefined, 'GET')
      .then((data) => {
        setListingInfo(data);
        setShowSpinner(false);
      })
      .catch(() => {
        navigate('/');
        navigate(0);
      });

    let d = new Date(Date.now());
    apiRequest(
      `listing/${listingId}/book/available?date=${d.setHours(10, 0, 0, 0)}`,
      undefined,
      'GET'
    )
      .then((data) => {
        setUpcomingAvailabilities(data);
      })
      .catch(() => {
        navigate('/');
        navigate(0);
      });

    apiRequest(`listing/${listingId}/review/all`, undefined, 'GET')
      .then((data) => {
        setReviewInfo(data);
      })
      .catch((error) => {
        console.log(error.detail);
      });

    apiRequest(`listing/${listingId}/permission`, undefined, 'GET').catch(() => {
      setPermission(true);
    });
  }, [listingId, navigate]);

  /** Create a carousel of listing images */
  const displayImages = () => {
    const images = [];
    for (const image of listingInfo.images) {
      images.push({ img: image.data });
    }
    return <Carousel images={images} title={listingInfo.title} />;
  };

  const ratingSpread = [0, 0, 0, 0, 0, 0];
  /**
   * @returns the average rating of all reviews
   */
  const getAverageRating = () => {
    if (reviewInfo.reviews.length === 0) {
      return 0;
    }

    let total = 0;
    for (const review of reviewInfo.reviews) {
      total += review.rating;
    }

    for (const review of reviewInfo.reviews) {
      ratingSpread[review.rating - 1] += 1;
      ratingSpread[5] += 1;
    }

    return total / reviewInfo.reviews.length;
  };

  /**
   * Create a list of date components, showing the availability of the listing fot the next week
   * @returns list of divs
   */
  const generateDates = () => {
    const dateList = [];
    let added = false;
    for (const [key, value] of Object.entries(upcomingAvailabilities)) {
      if (value.times.length !== 0) {
        for (const time of value.times) {
          added = true;
          dateList.push(
            <div key={`${key}-${dateList.length}`}>
              <u>Availability Slot {dateList.length + 1}:</u>
              <br />
              Date: {new Date(value.date).toLocaleDateString('en-AU')}
              <br />
              Start Time: {new Date(time.start_time).getHours()}:
              {String(new Date(time.start_time).getMinutes()).padStart(2, '0')} - End Time:{' '}
              {new Date(time.end_time).getHours()}:
              {String(new Date(time.end_time).getMinutes()).padStart(2, '0')}
            </div>
          );
        }
      }
    }

    if (!added) {
      return <div>No availabilities set for this week</div>;
    }
    return dateList;
  };

  /**
   * Show the availabilities of the listing that the owner has set
   * @returns list of divs
   */
  const generateDatesOwner = () => {
    const dateList = [];
    for (const date of listingInfo.availabilities) {
      dateList.push(
        <div key={`date${dateList.length}`}>
          <u>Availability Slot {dateList.length + 1}:</u>
          <br />
          Start Date: {new Date(date.start_date).toLocaleDateString('en-AU')} - End Date:{' '}
          {new Date(date.end_date).toLocaleDateString('en-AU')}
          <br />
          Start Time: {new Date(date.start_time).getHours()}:
          {String(new Date(date.start_time).getMinutes()).padStart(2, '0')} - End Time:{' '}
          {new Date(date.end_time).getHours()}:
          {String(new Date(date.end_time).getMinutes()).padStart(2, '0')}
        </div>
      );
    }

    if (dateList.length === 0) {
      return <div>No availabilities set</div>;
    }
    return dateList;
  };

  /** Navigate to the top of the view profile page */
  const toViewProfile = () => {
    window.scrollTo(0, 0);
    navigate(`/view_profile/${listingInfo.owner_id}`);
  };

  return (
    loggedIn && (
      <>
        <Header />
        {showSpinner && <LinearProgress id="loading-bar" />}
        <CentredContainer>
          {listingInfo !== null && (
            <>
              <div style={{ textAlign: 'center' }}>{listingInfo.title}</div>
              <br />
              <div>Address: {listingInfo.address}</div>
              <div>Length: {listingInfo.length}m</div>
              <div>Width: {listingInfo.width}m</div>
              {listingInfo.height !== null ? (
                <div>Height: {listingInfo.height}m (Undercover)</div>
              ) : (
                <div>Height: Not undercover</div>
              )}
              <div>Price per hour: ${listingInfo.price_per_hour} / hour</div>
              <div>
                Average Rating:
                <span>
                  <HoverRating
                    id={listingId}
                    svg={getAverageRating()}
                    ratingSpread={ratingSpread}
                  />
                </span>
              </div>
              <div>Listing Images: {displayImages()}</div>
              <div>
                {permission
                  ? 'Listing Availabilities over the next 7 days'
                  : 'Listing Availabilities'}
                : {permission ? generateDates() : generateDatesOwner()}
              </div>
              {listingInfo.availabilities.length !== 0 && permission && (
                <MakeBookingModal
                  availabilities={listingInfo.availabilities}
                  price={listingInfo.price_per_hour}
                  id={listingInfo.id}
                />
              )}
              <SecondaryButton onClick={toViewProfile} name={'View Owner Profile'} />
            </>
          )}
        </CentredContainer>
      </>
    )
  );
};

export default ViewListing;
