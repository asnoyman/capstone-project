import * as React from 'react';
import Header from '../components/Header';
import '../App.css';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../Api';
import { LinearProgress } from '@material-ui/core';
import CentredContainer from '../components/CentredContainer';
import Cookies from 'js-cookie';
import PrimaryButton from '../components/PrimaryButton';
import { Box, FormControl, TextField } from '@mui/material';
import { fileToDataUrl } from '../helpers';
import ShootEmojis from '../components/ShootEmojis';

const EditProfile = () => {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [clicked, setClicked] = React.useState(false);
  const [emojiList, setEmojiList] = React.useState([]);
  const userId = window.location.href.split('/')[4];

  /**
   * Check if the user has editting rights and is logged in.
   * Navigate them to the home page if not.
   */
  React.useEffect(() => {
    if (Cookies.get('token') !== undefined) {
      // Check if user
      apiRequest('token/user', undefined, 'POST')
        .then(() => {
          // Check if admin
          apiRequest('token/admin', undefined, 'POST')
            .then(() => {
              // If admin check that the url userId belongs to a user
              apiRequest(`user/profile/${userId}`, undefined, 'GET')
                .then(() => {
                  setLoggedIn(true);
                })
                .catch(() => {
                  navigate('/');
                  navigate(0);
                });
            })
            .catch(() => {
              // If not admin check if the url userId is the current user's
              apiRequest('user/profile', undefined, 'GET')
                .then((data) => {
                  if (data.id === parseInt(userId)) {
                    setLoggedIn(true);
                  } else {
                    navigate('/');
                    navigate(0);
                  }
                })
                .catch(() => {
                  navigate('/');
                  navigate(0);
                });
            });
        })
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
  localStorage.setItem('page', 'Edit Profile');
  document.title = 'Edit Profile';

  const [firstName, setFirstName] = React.useState('');
  const [oldFirstName, setOldFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [profilePicture, setProfilePicture] = React.useState('');
  const [oldProfilePicture, setOldProfilePicture] = React.useState('');

  /**
   * Get the existing user info and save it in the relevant useStates
   */
  React.useEffect(() => {
    apiRequest(`user/profile/${userId}`, undefined, 'GET')
      .then((data) => {
        setFirstName(data.first_name);
        setOldFirstName(data.first_name);
        setLastName(data.last_name);
        setOldProfilePicture(data.profile_picture);
        setShowSpinner(false);
      })
      .catch(() => {
        navigate('/');
        navigate(0);
      });
  }, [loggedIn]);

  /** Chec that the user data is valid and update the profile */
  const editProfile = async () => {
    const profileInfo = {
      first_name: firstName,
      last_name: lastName,
      profile_picture: oldProfilePicture,
    };

    const emojis = [];
    if (firstName !== oldFirstName) {
      await apiRequest('badge/add_badge_to_current_user?type_id=13', undefined, 'PUT')
        .then(() => {
          emojis.push('✏️');
        })
        .catch(() => {});
    }
    if (firstName === 'Haowei') {
      await apiRequest('badge/add_badge_to_current_user?type_id=17', undefined, 'PUT')
        .then(() => {
          emojis.push('💪');
        })
        .catch(() => {});
    }
    if (profilePicture) {
      await apiRequest('badge/add_badge_to_current_user?type_id=14', undefined, 'PUT')
        .then(() => {
          emojis.push('🎭');
        })
        .catch(() => {});
      fileToDataUrl(profilePicture).then((data) => {
        profileInfo.profile_picture = data;
        apiRequest(`user/profile/${userId}`, profileInfo, 'PUT')
          .then(() => {
            setEmojiList(emojis, setClicked(true));
          })
          .catch((error) => {
            console.log(error.detail);
          });
      });
    } else {
      apiRequest(`user/profile/${userId}`, profileInfo, 'PUT')
        .then(() => {
          setEmojiList(emojis, setClicked(true));
        })
        .catch((error) => {
          console.log(error.detail);
        });
    }
  };

  return (
    loggedIn && (
      <>
        <Header />
        {showSpinner && <LinearProgress id="loading-bar" />}
        <CentredContainer>
          <Box style={{ display: 'flex', placeContent: 'center', marginTop: '20vh' }}>
            <FormControl>
              <TextField
                required
                id="first-name-input"
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <br />
              <TextField
                required
                id="last-name-input"
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              <br />
              <TextField
                required
                type="file"
                id="profile-picture"
                label="Profile Picture"
                defaultValue=""
                InputLabelProps={{ shrink: true }}
                onChange={(e) => {
                  setProfilePicture(e.target.files[0]);
                }}
                style={{ display: 'block' }}
              />
              <br />
              <PrimaryButton name="Edit Profile" onClick={editProfile} />
            </FormControl>
          </Box>
        </CentredContainer>
        {clicked && (
          <ShootEmojis
            emojis={emojiList}
            complete={() => {
              setClicked(false);
              navigate(`/view_profile/${userId}`);
            }}
          />
        )}
      </>
    )
  );
};

export default EditProfile;
