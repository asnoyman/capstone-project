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
import SecondaryButton from './SecondaryButton';

const UserTable = ({ data }) => {
  const navigate = useNavigate();
  const [listings, setListings] = React.useState([]);

  /** The css for the Table */
  const table = {
    overflowX: 'auto',
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

  /** Sort the users by email when the data is fetched */
  React.useEffect(() => {
    data.then((listingData) => {
      listingData.sort((a, b) => a.email.localeCompare(b.email));
      setListings(listingData);
    });
  }, [data]);

  /** Promote user to admin status */
  const promoteUser = (id) => {
    if (window.confirm('Are you sure you want to promote this user to admin?')) {
      apiRequest(`admin/promote/${id}`, undefined, 'PUT')
        .then(() => {
          navigate(0);
        })
        .catch((error) => {
          alert(error.detail);
        });
    }
  };

  /** Demote user from admin status */
  const demoteUser = (id) => {
    if (window.confirm('Are you sure you want to demote this user from admin?')) {
      apiRequest(`admin/demote/${id}`, undefined, 'PUT')
        .then(() => {
          navigate(0);
        })
        .catch((error) => {
          alert(error.detail);
        });
    }
  };

  /** Delete user from the website */
  const deleteUser = (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      apiRequest(`admin/remove/user/${id}`, undefined, 'DELETE')
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
              style={{
                position: 'sticky',
                top: 0,
                backgroundColor: 'white',
                zIndex: 1001,
              }}
            >
              <TableCell key="title">First Name</TableCell>
              <TableCell key="thumbnail">Last Name</TableCell>
              <TableCell key="address">Email</TableCell>
              <TableCell key="profile-photo">Profile Photo</TableCell>
              <TableCell key="make-or-remove-admin">Admin Status</TableCell>
              <TableCell key="edit">Edit User</TableCell>
              <TableCell key="delete">Delete User</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {listings.length === 0 ? (
              <TableRow>
                <TableCell>No Users</TableCell>
              </TableRow>
            ) : (
              listings.map(({ id, fName, lName, email, profile_picture, isAdmin }) => (
                <TableRow
                  key={id}
                  onClick={() => {
                    navigate(`/view_profile/${id}`);
                  }}
                  hover={true}
                  style={{ cursor: 'pointer' }}
                >
                  <TableCell key={`fName${id}`}>{fName}</TableCell>
                  <TableCell key={`lName${id}`}>{lName}</TableCell>
                  <TableCell key={`email${id}`}>{email}</TableCell>
                  <TableCell key={`profile_picture${id}`}>
                    <img
                      src={
                        profile_picture !== null
                          ? profile_picture
                          : 'https://i.stack.imgur.com/l60Hf.png'
                      }
                      alt={`profile of user ${fName} " " ${lName}`}
                      style={thumbnailStyle}
                    />
                  </TableCell>
                  <TableCell key={`promote${id}`}>
                    {!isAdmin ? (
                      <PrimaryButton
                        name="Promote User"
                        onClick={(e) => {
                          e.stopPropagation();
                          promoteUser(id);
                        }}
                      />
                    ) : (
                      <SecondaryButton
                        name="Demote User"
                        onClick={(e) => {
                          e.stopPropagation();
                          demoteUser(id);
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell key={`edit${id}`}>
                    <PrimaryButton
                      name="Edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/edit_profile/${id}`);
                      }}
                    />
                  </TableCell>
                  <TableCell key={`delete${id}`}>
                    <IconButton
                      aria-label="delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteUser(id);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </div>
  );
};

UserTable.propTypes = {
  /** A promise of the data with all the users on the website */
  data: PropTypes.instanceOf(Promise).isRequired,
};

export default UserTable;
