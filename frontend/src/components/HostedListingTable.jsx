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
import { IconButton } from '@material-ui/core';
import DeleteIcon from '@mui/icons-material/Delete';
import { apiRequest } from '../Api';
import PrimaryButton from './PrimaryButton';
import AddAvailabilitiesModal from './AddAvailabilitiesModal';
import HoverRating from './HoverRating';

const HostedListingTable = ({ data, admin }) => {
  const navigate = useNavigate();
  const [listings, setListings] = React.useState([]);

  /** The css for the Table */
  const table = {
    overflowX: 'auto',
    marginTop: '50px',
    padding: admin ? '0 10px 10px 10px' : '10px',
    margin: '10px',
    maxHeight: admin && '39vh',
    overflowY: admin && 'scroll',
  };

  /** The css for the thumbnail */
  const thumbnailStyle = {
    maxWidth: '170px',
    maxHeight: '140px',
    objectFit: 'contain',
  };

  /** Sets the listing data of the user's hosted listings */
  React.useEffect(() => {
    data.then((listingData) => {
      setListings(listingData);
    });
  }, [data]);

  /** Deletes a listing that the user owns, with id = id */
  const deleteListing = (id) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      apiRequest(`listing/${id}`, undefined, 'DELETE')
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
      <Paper style={table}>
        <Table>
          <TableHead>
            <TableRow
              style={
                admin && {
                  position: 'sticky',
                  top: 0,
                  backgroundColor: 'white',
                  zIndex: 1001,
                }
              }
            >
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
              <TableCell key="review" numeric="true">
                Reviews
              </TableCell>
              <TableCell key="edit"></TableCell>
              {!admin && <TableCell key="availabilities"></TableCell>}
              <TableCell key="delete"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {listings.length === 0 ? (
              <TableRow>
                <TableCell>No hosted listings</TableCell>
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
                  availabilities,
                  svg,
                  ratingSpread,
                }) => (
                  <TableRow
                    key={id}
                    onClick={() => {
                      navigate(`/view_listing/${id}`);
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
                          src={thumbnail}
                          title={`youtube${id}`}
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
                    <TableCell key={`review${id}`} aria-haspopup="true">
                      <HoverRating id={id} svg={svg} ratingSpread={ratingSpread} />
                    </TableCell>
                    <TableCell key={`edit${id}`}>
                      <PrimaryButton
                        name="Edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/edit_listing/${id}`);
                        }}
                      />
                    </TableCell>
                    {!admin && (
                      <TableCell key={`go-live${id}`}>
                        <AddAvailabilitiesModal id={id} availabilities={availabilities} />
                      </TableCell>
                    )}
                    <TableCell key={`delete${id}`}>
                      <IconButton
                        aria-label="delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteListing(id);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
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

HostedListingTable.propTypes = {
  /** A promise of all of the listings the user has hosted */
  data: PropTypes.instanceOf(Promise).isRequired,
  /** A bool that says if the user is an admin */
  admin: PropTypes.bool,
};

export default HostedListingTable;
