import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import PropTypes from 'prop-types';
import '../App.css';
import SearchBar from 'material-ui-search-bar';
import { LinearProgress, TextField } from '@material-ui/core';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import HoverRating from './HoverRating';
import { usePlacesWidget } from 'react-google-autocomplete';

const AllListingTable = ({ data }) => {
  const [searched, setSearched] = React.useState('');
  const [listings, setListings] = React.useState([]);
  const [fullListings, setFullListings] = React.useState([]);
  const [showSpinner, setShowSpinner] = React.useState(true);
  const [desiredAddress, setDesiredAddress] = React.useState('');

  const navigate = useNavigate();

  /** The css for the Table */
  const table = {
    overflowX: 'auto',
    marginTop: '50px',
    padding: '10px',
    margin: '10px',
  };

  /** The css for the thumbnail */
  const thumbnailStyle = {
    maxWidth: '170px',
    maxHeight: '140px',
    objectFit: 'contain',
  };

  /**
   * Call an API to get the distance from the destination to each listing
   * Save the information in listings and fullListings, ordered by closest
   * location to furthest
   */
  const getDistanceMatrix = (origins, destinations) => {
    const service = new window.google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      {
        origins: origins,
        destinations: destinations,
        travelMode: 'DRIVING',
        unitSystem: window.google.maps.UnitSystem.METRIC,
      },
      (response, status) => {
        if (status !== 'OK') {
          console.log('Error:', status);
        } else {
          const distances = response.rows[0].elements.map(
            (element) => element.distance.value / 1000
          );
          const listingsWithDistances = fullListings.map((listing, index) => ({
            ...listing,
            distance: distances[index],
          }));
          listingsWithDistances.sort((a, b) => a.distance - b.distance);
          setListings(listingsWithDistances);
          setFullListings(listingsWithDistances);
        }
        setShowSpinner(false);
      }
    );
  };

  /**
   * Unpack the listing information into locations and distances.
   * If distance is not included, sort by average rating
   */
  const unwrapData = () => {
    setShowSpinner(false);
    setSearched('');
    data.then((listingData) => {
      if (listingData.length !== 0) {
        // Sort by distance otherwise reviews
        if (desiredAddress !== '') {
          const origins = [desiredAddress];
          const destinations = listingData.map((listing) => listing.address);
          getDistanceMatrix(origins, destinations);
        } else {
          listingData.sort((a, b) => {
            return b.svg - a.svg;
          });
          setListings(listingData);
          setFullListings(listingData);
        }
      }
    });
  };

  /**
   * Filter the listings to ones that only contain the search param in the title or address
   * @param {String} search
   */
  const requestSearch = (search) => {
    setShowSpinner(true);
    setSearched(search);
    if (search === '') {
      setListings(fullListings);
    } else {
      const filteredListings = fullListings.filter((listing) => {
        return (
          listing.title.toLowerCase().includes(search.toLowerCase()) ||
          listing.address.toLowerCase().includes(search.toLowerCase())
        );
      });
      setListings(filteredListings);
    }
    setShowSpinner(false);
  };

  /** Stops filtering the listings */
  const cancelSearch = () => {
    setSearched('');
    requestSearch('');
  };

  /** Unwrap the listing data every time a new destination is entered, with new distances  */
  React.useEffect(() => {
    unwrapData();
  }, [desiredAddress]);

  /** Google API for entering addresses */
  const { ref: materialRef } = usePlacesWidget({
    apiKey: 'AIzaSyDRV3vh4--K7xfjtLGmq9mcfHj3TBozuik',
    onPlaceSelected: (place) => {
      setDesiredAddress(place.formatted_address);
    },
    options: {
      types: ['geocode'],
      componentRestrictions: {
        country: 'au',
      },
    },
  });

  return (
    <div>
      <Paper style={table}>
        {showSpinner && <LinearProgress id="loading-bar" />}
        <SearchBar
          value={searched}
          onChange={(searchVal) => requestSearch(searchVal)}
          onCancelSearch={() => cancelSearch()}
        />
        <TextField
          id="Desired Location"
          label="Desired Location"
          inputRef={materialRef}
          style={{ width: '350px', paddingRight: '10px' }}
        />
        <Table>
          <TableHead>
            <TableRow>
              <TableCell key="title">Title</TableCell>
              <TableCell key="thumbnail">Thumbnail</TableCell>
              <TableCell key="address">Address</TableCell>
              <TableCell key="length" numeric="true">
                Length
              </TableCell>
              <TableCell key="width" numeric="true">
                Width
              </TableCell>
              <TableCell key="height" numeric="true">
                Height
              </TableCell>
              <TableCell key="price" numeric="true">
                Price per hour ($AUD)
              </TableCell>
              {desiredAddress !== '' && (
                <TableCell key="distance" numeric="true">
                  Distance to desired location (km)
                </TableCell>
              )}
              <TableCell key="review" numeric="true">
                Reviews
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {listings.length === 0 ? (
              <TableRow>
                <TableCell>No published listings</TableCell>
              </TableRow>
            ) : (
              listings.map(
                ({
                  id,
                  title,
                  address,
                  length,
                  width,
                  height,
                  thumbnail,
                  price,
                  distance,
                  svg,
                  ratingSpread,
                }) => (
                  <TableRow
                    key={id}
                    onClick={() => {
                      if (Cookies.get('token') === undefined) {
                        alert('You must be logged in to view a listing');
                      } else {
                        navigate(`/view_listing/${id}`);
                      }
                    }}
                    hover={true}
                    style={{ cursor: 'pointer' }}
                  >
                    <TableCell key={`title${id}`}>{title}</TableCell>
                    <TableCell key={`thumbnail${id}`}>
                      {!thumbnail.includes('www.youtube.com') ? (
                        <img
                          src={thumbnail}
                          alt={`thumbnail of property ${title}`}
                          style={thumbnailStyle}
                        />
                      ) : (
                        <iframe
                          id="video"
                          width="170"
                          height="140"
                          title={`youtube${id}`}
                          src={thumbnail}
                          allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      )}
                    </TableCell>
                    <TableCell key={`address${id}`}>{address}</TableCell>
                    <TableCell key={`length${id}`}>{length}</TableCell>
                    <TableCell key={`width${id}`}>{width}</TableCell>
                    <TableCell key={`height${id}`}>{height}</TableCell>
                    <TableCell key={`price${id}`} numeric="true">
                      {price}
                    </TableCell>
                    {desiredAddress !== '' && (
                      <TableCell key={`distance${id}`} numeric="true">
                        {distance}
                      </TableCell>
                    )}
                    <TableCell key={`review${id}`} aria-haspopup="true">
                      <HoverRating id={id} svg={svg} ratingSpread={ratingSpread} />
                    </TableCell>
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

AllListingTable.propTypes = {
  /** The listing data fetched from the backend */
  data: PropTypes.instanceOf(Promise).isRequired,
};

export default AllListingTable;
