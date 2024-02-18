import React from 'react';
import Header from '../components/Header';
import { LinearProgress } from '@material-ui/core';
import { apiRequest } from '../Api';
import AllListingTable from '../components/AllListingsTable';

const Site = () => {
  const [showSpinner, setShowSpinner] = React.useState(true);
  localStorage.setItem('page', 'ParkShare');
  document.title = 'ParkShare';

  const listingData = [];
  /**
   * Get the information about every listing hosted on the website
   * @returns list of listing information
   */
  const getRows = async () => {
    const json = await apiRequest('listing/all', undefined, 'GET').catch((error) => {
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
        availability: listing.availabilities,
      });
    });
    setShowSpinner(false);
    return listingData;
  };

  return (
    <>
      <Header />
      {showSpinner && <LinearProgress id="loading-bar" />}
      <br />
      <AllListingTable data={getRows()}></AllListingTable>
    </>
  );
};

export default Site;
