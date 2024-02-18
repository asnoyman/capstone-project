import * as React from 'react';
import Header from '../components/Header';
import '../App.css';
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  InputAdornment,
  TextField,
} from '@material-ui/core';
import { fileToDataUrl } from '../helpers';
import { usePlacesWidget } from 'react-google-autocomplete';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../Api';
import CentredContainer from '../components/CentredContainer';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';
import Cookies from 'js-cookie';
import ShootEmojis from '../components/ShootEmojis';

const CreateListing = () => {
  const navigate = useNavigate();

  /**
   * If the user isn't logged in or does not have a bank account registered, navigate to the home page.
   */
  React.useEffect(() => {
    if (Cookies.get('token') !== undefined) {
      apiRequest('token/user', undefined, 'POST')
        .then(() => {
          apiRequest('user/payment/account', undefined, 'GET').catch(() => {
            alert('You must add your bank details to your profile before creating a listing');
            navigate('/');
            navigate(0);
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

  localStorage.setItem('page', 'Create Listing');
  document.title = 'Create Listing';

  const [title, setTitle] = React.useState('');
  const [width, setWidth] = React.useState(0);
  const [length, setLength] = React.useState(0);
  const [undercover, setUndercover] = React.useState(false);
  const [height, setHeight] = React.useState(0);
  const [thumbnail, setThumbnail] = React.useState(null);
  const [thumbnailType, setThumbnailType] = React.useState(null);
  const [address, setAddress] = React.useState('');
  const [price, setPrice] = React.useState(0);
  const [clicked, setClicked] = React.useState(false);
  const [emojiList, setEmojiList] = React.useState([]);

  /**
   * Check the listing information is valid and send the data to the backend
   */
  const createListing = async () => {
    if (title === '') {
      alert("You didn't give your listing a title");
      return;
    }
    if (address === '') {
      alert("You didn't give your listing an address");
      return;
    }
    if (!/^\d+\.{0,1}\d{0,2}(?<!\.)$/.test(length) || length === 0) {
      alert(
        'Length must be a positive number with at most two decimal places and no trailing decimal point.'
      );
      if (length !== 0) {
        document.getElementById('listing-length').value = '0';
      }
      return;
    }
    if (!/^\d+\.{0,1}\d{0,2}(?<!\.)$/.test(width) || width === 0) {
      alert(
        'Width must be a positive number with at most two decimal places and no trailing decimal point.'
      );
      if (width !== 0) {
        document.getElementById('listing-width').value = '0';
      }
      return;
    }
    if (
      (undercover && !/^\d+\.{0,1}\d{0,2}(?<!\.)$/.test(height)) ||
      (undercover && height === 0)
    ) {
      alert(
        'If height is given, it must be a positive number with at most two decimal places and no trailing decimal point.'
      );
      if (height !== 0) {
        document.getElementById('listing-height').value = '0';
      }
      return;
    }
    if (!/^\d+\.{0,1}\d{0,2}(?<!\.)$/.test(price) || price === 0) {
      alert(
        'Price must be a positive number with at most two decimal places and no trailing decimal point.'
      );
      if (price !== 0) {
        document.getElementById('listing-price').value = '0';
      }
      return;
    }
    const listing = {
      title: title,
      address: address,
      length: parseFloat(length),
      width: parseFloat(width),
      price_per_hour: parseFloat(price),
      images: [],
    };
    if (undercover) {
      listing['height'] = height;
    }
    const emojis = [];
    await apiRequest('badge/add_badge_to_current_user?type_id=1', undefined, 'PUT')
      .then(() => {
        emojis.push('🚘');
      })
      .catch(() => {});
    if (thumbnail !== null) {
      try {
        if (thumbnailType !== 'photo') {
          const newThumbnail = thumbnail.replace('watch?v=', 'embed/');
          listing.images = [newThumbnail];
          apiRequest('listing/create', listing, 'POST')
            .then(async () => {
              await apiRequest('badge/add_badge_to_current_user?type_id=2', undefined, 'PUT')
                .then(() => {
                  emojis.push('🎞');
                  setEmojiList(emojis, setClicked(true));
                })
                .catch(() => {});
            })
            .catch((error) => {
              alert(error.detail);
            });
        } else {
          fileToDataUrl(thumbnail)
            .then((data) => {
              listing.images = [data];
              apiRequest('listing/create', listing, 'POST')
                .then(() => {
                  setEmojiList(emojis, setClicked(true));
                })
                .catch((error) => {
                  console.log(error.detail);
                });
            })
            .catch((error) => {
              document.getElementById('listing-thumbnail').value = '';
              console.log(error);
            });
        }
      } catch (error) {
        document.getElementById('listing-thumbnail').value = '';
      }
    } else {
      alert("You didn't enter a thumbnail");
    }
  };

  const { ref: materialRef } = usePlacesWidget({
    apiKey: 'AIzaSyDRV3vh4--K7xfjtLGmq9mcfHj3TBozuik',
    onPlaceSelected: (place) => {
      setAddress(place.formatted_address);
    },
    options: {
      types: ['geocode'],
      componentRestrictions: {
        country: 'au',
      },
    },
  });

  return (
    <>
      <Header />
      <CentredContainer>
        <FormControl>
          <TextField
            required
            id="listing-title"
            label="Title"
            defaultValue=""
            style={{ minWidth: '308px' }}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextField required id="address" label="Address" inputRef={materialRef} />
          <TextField
            required
            id="listing-length"
            label="Space Length"
            InputProps={{
              endAdornment: <InputAdornment position="end">m</InputAdornment>,
            }}
            onChange={(e) => setLength(e.target.value)}
          />
          <TextField
            required
            id="listing-width"
            label="Space Width"
            InputProps={{
              endAdornment: <InputAdornment position="end">m</InputAdornment>,
            }}
            onChange={(e) => setWidth(e.target.value)}
          />
          <FormControlLabel
            required
            id="listing-undercover"
            label="Undercover Spot"
            control={<Checkbox />}
            onChange={(e) => setUndercover(e.target.checked)}
          />
          {undercover && (
            <TextField
              id="listing-height"
              label="Space Height"
              required
              InputProps={{
                endAdornment: <InputAdornment position="end">m</InputAdornment>,
              }}
              onChange={(e) => setHeight(e.target.value)}
            />
          )}
          {thumbnailType === null && undercover && <br />}
          <div style={{ display: thumbnailType !== null ? 'none' : 'block' }}>
            <PrimaryButton name="Photo Thumbnail" onClick={() => setThumbnailType('photo')} />
            <PrimaryButton name="Youtube Thumbnail" onClick={() => setThumbnailType('youtube')} />
          </div>
          {thumbnailType === null && <br />}
          <TextField
            required
            type="file"
            id="listing-thumbnail"
            label="Thumbnail"
            defaultValue=""
            InputLabelProps={{ shrink: true }}
            onChange={(e) => {
              setThumbnail(e.target.files[0]);
            }}
            style={{ display: thumbnailType === 'photo' ? 'block' : 'none' }}
          />
          <TextField
            id="listing-thumbnail-youtube"
            label="Youtube Thumbnail Link"
            defaultValue=""
            fullWidth
            required
            style={{ display: thumbnailType === 'youtube' ? 'block' : 'none' }}
            onChange={(e) => {
              setThumbnail(e.target.value);
            }}
          />
          <TextField
            required
            id="listing-price"
            label="Price per hour ($AUD)"
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            onChange={(e) => setPrice(e.target.value)}
          />
          <br />
          <PrimaryButton name="Create Listing" onClick={() => createListing()} />
          <br />
          <SecondaryButton
            name="Back to your listings"
            onClick={() => navigate('/hosted_listings')}
          />
        </FormControl>
      </CentredContainer>
      {clicked && (
        <ShootEmojis
          emojis={emojiList}
          complete={() => {
            setClicked(false);
            navigate(`/hosted_listings`);
          }}
        />
      )}
    </>
  );
};

export default CreateListing;
