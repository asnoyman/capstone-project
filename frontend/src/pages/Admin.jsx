import React from 'react';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../Api';
import { LinearProgress } from '@material-ui/core';
import Cookies from 'js-cookie';
import HostedListingTable from '../components/HostedListingTable';
import UserTable from '../components/UserTable';

const HostedListings = () => {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = React.useState(false);

  /** If the user isn't a logged in admin, navigate to the home page */
  React.useEffect(() => {
    if (Cookies.get('token') !== undefined) {
      apiRequest('token/admin', undefined, 'POST')
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

  const [loadingListingTable, setLoadingListingTable] = React.useState(true);
  const [loadingUserTable, setLoadingUserTable] = React.useState(true);
  localStorage.setItem('page', 'Admin Page');
  document.title = 'Admin Page';

  const listingData = [];
  /**
   * @returns a list of all listings' information
   */
  const getListingRows = async () => {
    const json = await apiRequest('listing/all', undefined, 'GET').catch((error) => {
      setLoadingListingTable(false);
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

    setLoadingListingTable(false);
    return listingData;
  };

  const userData = [];
  /**
   * @returns a list of all users' information
   */
  const getUserRows = async () => {
    const json = await apiRequest('admin/users', undefined, 'GET').catch((error) => {
      setLoadingUserTable(false);
      console.log(error);
    });
    await json.forEach((user) => {
      userData.push({
        id: user.id,
        fName: user.first_name,
        lName: user.last_name,
        email: user.email,
        profile_picture: user.profile_picture,
        isAdmin: user.isAdmin,
      });
    });
    setLoadingUserTable(false);
    return userData;
  };

  return (
    loggedIn && (
      <>
        <Header />
        {(loadingListingTable || loadingUserTable) && <LinearProgress id="loading-bar" />}
        <br />
        <div style={{ paddingLeft: '10px' }}>All Users</div>
        <UserTable data={getUserRows()}></UserTable>
        <div style={{ paddingLeft: '10px' }}>All Listings</div>
        <HostedListingTable data={getListingRows()} admin={true}></HostedListingTable>
      </>
    )
  );
};

export default HostedListings;
