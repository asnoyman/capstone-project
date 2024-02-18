import * as React from 'react';
import Header from '../components/Header';
import '../App.css';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../Api';
import { Grid, LinearProgress, Popover } from '@material-ui/core';
import CentredContainer from '../components/CentredContainer';
import Cookies from 'js-cookie';
import PrimaryButton from '../components/PrimaryButton';
import AddBankDetailsModal from '../components/AddBankDetailsModal';
import badges from '../badges.json';
import { Box } from '@mui/material';
import ShootEmojis from '../components/ShootEmojis';

/** css for profile pictures */
const imageStyle = {
  maxWidth: '300px',
  maxHeight: '300px',
  objectFit: 'contain',
};

const ViewProfile = () => {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [badgesEarned, setBadgesEarned] = React.useState([]);
  const [clicked, setClicked] = React.useState(false);
  const [openedPopover, setOpenedPopover] = React.useState(-1);

  /** Set the id of the user who owns the listing the mouse is over */
  const popoverEnter = (id) => {
    setOpenedPopover(id);
  };

  /** Set the id to '' when the mouse is not over any listing */
  const popoverLeave = () => {
    setOpenedPopover('');
  };

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
  localStorage.setItem('page', 'View Profile');
  document.title = 'View Profile';

  const [userInfo, setUserInfo] = React.useState(null);
  const [isCurrentUser, setIsCurrentUser] = React.useState(false);
  const [viewingUsersId, setViewingUsersId] = React.useState('');
  const userId = window.location.href.split('/')[4];

  /** Navigate to the edit profile page */
  const editProfile = () => {
    window.scrollTo(0, 0);
    navigate(`/edit_profile/${userInfo.id}`);
  };

  /**
   * On page load, set values if the user viewing the profile is an admin
   * or if they are viewing their own profile or both
   */
  React.useEffect(() => {
    apiRequest(`user/profile/${userId}`, undefined, 'GET')
      .then((data) => {
        setUserInfo(data);
        setShowSpinner(false);
        apiRequest('token/admin', undefined, 'POST')
          .then(() => setIsCurrentUser(true))
          .catch(() => {
            apiRequest('user/profile', undefined, 'GET')
              .then((data) => {
                if (data.id === parseInt(userId)) {
                  setIsCurrentUser(true);
                }
              })
              .catch(() => {
                navigate('/');
                navigate(0);
              });
          });
      })
      .catch(() => {
        navigate('/');
        navigate(0);
      });
    apiRequest('user/profile', undefined, 'GET')
      .then((data) => {
        setViewingUsersId(data.id);
        if (data.id !== parseInt(userId)) {
          apiRequest('badge/add_badge_to_current_user?type_id=16', undefined, 'PUT')
            .then(() => {
              setClicked(true);
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, [loggedIn]);

  React.useEffect(() => {
    apiRequest(`badge/${userId}`, undefined, 'GET')
      .then((data) => {
        const temp = [];
        for (const key in data) {
          if (data[key]) {
            temp.push(key - 1);
          }
        }
        setBadgesEarned(temp);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  return (
    loggedIn && (
      <>
        <Header />
        {showSpinner && <LinearProgress id="loading-bar" />}
        <CentredContainer>
          {userInfo !== null && (
            <>
              <div style={{ textAlign: 'center' }}>{userInfo.first_name}'s Profile</div>
              <div>First Name: {userInfo.first_name}</div>
              <div>Last name: {userInfo.last_name}</div>
              <div>Email: {userInfo.email}</div>
              <div>Profile Photo:</div>
              <img
                src={
                  userInfo.profile_picture !== null
                    ? userInfo.profile_picture
                    : 'https://i.stack.imgur.com/l60Hf.png'
                }
                alt={`${userInfo.first_name}'s profile`}
                style={imageStyle}
              />
              <br />
            </>
          )}
          {/* If viewing/editing your own profile */}
          {userInfo !== null && isCurrentUser && (
            <>
              <PrimaryButton name="Edit Profile" onClick={editProfile} />
              <br />
              <br />
              <u>Bank Details:</u>
              {userInfo.bsb === null || userInfo.account_number === null ? (
                <div>No bank details set yet</div>
              ) : (
                <>
                  <div>BSB: {userInfo.bsb}</div>
                  <div>Account Number: {userInfo.account_number}</div>
                  <div>Revenue: ${userInfo.balance}</div>
                </>
              )}
              {userInfo.isAdmin && <div>Accumulated Sevice Fees: ${userInfo.system_balance}</div>}
              {viewingUsersId === parseInt(userId) && <AddBankDetailsModal />}
              <br />
            </>
          )}
          {userInfo !== null && (
            <>
              <div>Badges:</div>
              <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
                {badges.map((val, key) => (
                  <Grid item xs={2} sm={4} md={4} key={val[0]}>
                    <Box
                      key={val[0]}
                      onMouseEnter={() => {
                        popoverEnter(val[0]);
                      }}
                      onMouseLeave={popoverLeave}
                      aria-owns={openedPopover !== -1 ? 'mouse-over-popover' : undefined}
                      aria-haspopup="true"
                      aria-label="hover-span"
                    >
                      <div
                        id={val[0]}
                        className={badgesEarned.includes(key) ? 'badge' : 'greyScaleBadge'}
                      >
                        {val[0]}
                      </div>
                      <Popover
                        id="mouse-over-popover"
                        open={openedPopover !== '' && openedPopover === val[0]}
                        style={{ pointerEvents: 'none', marginTop: '5px' }}
                        anchorEl={document.getElementById(val[0])}
                        anchorOrigin={{
                          vertical: 'bottom',
                          horizontal: 'center',
                        }}
                        transformOrigin={{
                          vertical: 'top',
                          horizontal: 'center',
                        }}
                        onClose={popoverLeave}
                        PaperProps={{
                          onMouseEnter: () => {
                            popoverEnter(val[0]);
                          },
                          onMouseLeave: popoverLeave,
                        }}
                      >
                        <div style={{ pointerEvents: 'auto' }} aria-label="badge-info">
                          {val[1]}
                        </div>
                      </Popover>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </CentredContainer>
        {clicked && (
          <ShootEmojis
            emojis={['👬']}
            complete={() => {
              setClicked(false);
            }}
          />
        )}
      </>
    )
  );
};

export default ViewProfile;
