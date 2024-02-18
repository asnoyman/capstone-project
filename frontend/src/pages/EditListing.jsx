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

const EditListing = () => {
  const navigate = useNavigate();
  const listingId = window.location.href.split('/')[4];

  /**
   * If the user isn't logged in or does not have editting rights, navigate to the home page.
   */
  React.useEffect(() => {
    if (Cookies.get('token') !== undefined) {
      apiRequest('token/user', undefined, 'POST')
        .then(() => {
          apiRequest(`listing/${listingId}/permission`, undefined, 'GET').catch(() => {
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

  localStorage.setItem('page', 'Edit Listing');
  document.title = 'Edit Listing';

  const [title, setTitle] = React.useState('');
  const [width, setWidth] = React.useState(0);
  const [length, setLength] = React.useState(0);
  const [undercover, setUndercover] = React.useState(false);
  const [remove, setRemove] = React.useState(false);
  const [height, setHeight] = React.useState(0);
  const [thumbnail, setThumbnail] = React.useState(null);
  const [oldThumbnail, setOldThumbnail] = React.useState(null);
  const [thumbnailType, setThumbnailType] = React.useState(null);
  const [images, setImages] = React.useState([]);
  const [oldImages, setOldImages] = React.useState([]);
  const [oldAddress, setOldAddress] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [price, setPrice] = React.useState(0);
  const [clicked, setClicked] = React.useState(false);
  const [emojiList, setEmojiList] = React.useState([]);

  /**
   * Get the existing listing data and store it in the relevant useStates.
   */
  React.useEffect(() => {
    const getListingData = async () =>
      await apiRequest(`listing/${listingId}`, undefined, 'GET').catch(() => {
        navigate('/');
        navigate(0);
      });
    getListingData().then((data) => {
      setTitle(data.title);
      setLength(data.length);
      setWidth(data.width);
      if (data.height !== null) {
        setHeight(data.height);
        setUndercover(true);
      }
      setOldAddress(data.address);
      setPrice(data.price_per_hour);
      setOldImages(
        data.images.map((image) => {
          return image.data;
        })
      );
      setOldThumbnail(data.images[0].data);
      document.getElementById('address').value = data.address;
    });
  }, [listingId, navigate]);

  /**
   * Chech the new data is valid and update the listing with the new information
   */
  const editListing = async () => {
    if (title === '') {
      alert("You didn't give your listing a title");
      return;
    }
    if (!/^\d+\.{0,1}\d{0,2}(?<!\.)$/.test(length)) {
      alert(
        'Length must be a positive number with at most two decimal places and no trailing decimal point.'
      );
      document.getElementById('listing-length').value = '0';
      return;
    }
    if (!/^\d+\.{0,1}\d{0,2}(?<!\.)$/.test(width)) {
      alert(
        'Width must be a positive number with at most two decimal places and no trailing decimal point.'
      );
      document.getElementById('listing-width').value = '0';
      return;
    }
    if (undercover && !/^\d+\.{0,1}\d{0,2}(?<!\.)$/.test(height)) {
      alert(
        'If height is given, it must be a positive number with at most two decimal places and no trailing decimal point.'
      );
      document.getElementById('listing-height').value = '0';
      return;
    }
    if (!/^\d+\.{0,1}\d{0,2}(?<!\.)$/.test(price)) {
      alert(
        'Price must be a positive number with at most two decimal places and no trailing decimal point.'
      );
      document.getElementById('listing-price').value = '0';
      return;
    }
    let temp_address = address;
    if (temp_address === '') {
      temp_address = oldAddress;
    }
    const listing = {
      title: title,
      address: temp_address,
      length: parseFloat(length),
      width: parseFloat(width),
      price_per_hour: parseFloat(price),
      images: [],
    };

    if (undercover) {
      listing['height'] = height;
    }
    const emojis = [];
    let formatThumbnail = oldThumbnail;
    if (thumbnail !== null) {
      if (thumbnailType === 'photo') {
        try {
          await fileToDataUrl(thumbnail)
            .then((data) => {
              formatThumbnail = data;
            })
            .catch((error) => {
              document.getElementById('listing-thumbnail').value = '';
              console.log(error);
            });
        } catch (error) {
          document.getElementById('listing-thumbnail').value = '';
          return;
        }
      } else if (thumbnailType === 'youtube') {
        formatThumbnail = thumbnail.replace('watch?v=', 'embed/');
        await apiRequest('badge/add_badge_to_current_user?type_id=2', undefined, 'PUT')
          .then(() => {
            emojis.push('🎞');
          })
          .catch(() => {});
      }
    }

    listing.images.push(formatThumbnail);

    if (images.length !== 0) {
      try {
        for (const image of images) {
          await fileToDataUrl(image)
            .then((data) => {
              listing.images.push(data);
            })
            .catch((error) => {
              document.getElementById('listing-images').value = '';
              console.log(error);
            });
        }
        await apiRequest('badge/add_badge_to_current_user?type_id=3', undefined, 'PUT')
          .then(() => {
            emojis.push('🖼️');
          })
          .catch(() => {});
      } catch (error) {
        document.getElementById('listing-images').value = '';
        return;
      }
    } else if (!remove) {
      oldImages.splice(0, 1);
      listing.images = listing.images.concat(oldImages);
    }

    apiRequest(`listing/${listingId}`, listing, 'PUT')
      .then(() => {
        setEmojiList(emojis, setClicked(true));
      })
      .catch((error) => {
        alert(error.detail);
      });
  };

  const { ref: materialRef } = usePlacesWidget({
    apiKey: 'AIzaSyDRV3vh4--K7xfjtLGmq9mcfHj3TBozuik',
    onPlaceSelected: (place) => {
      setAddress(place.formatted_address);
    },
    options: {
      types: ['geocode'],
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
            value={title}
            style={{ minWidth: '308px' }}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextField
            id="address"
            label="Address"
            InputLabelProps={{ shrink: true }}
            inputRef={materialRef}
          />
          <TextField
            required
            id="listing-length"
            label="Space Length"
            value={length}
            InputProps={{
              endAdornment: <InputAdornment position="end">m</InputAdornment>,
            }}
            onChange={(e) => setLength(e.target.value)}
          />
          <TextField
            required
            id="listing-width"
            label="Space Width"
            value={width}
            InputProps={{
              endAdornment: <InputAdornment position="end">m</InputAdornment>,
            }}
            onChange={(e) => setWidth(e.target.value)}
          />
          <FormControlLabel
            id="listing-undercover"
            label="Undercover Spot"
            checked={undercover}
            control={<Checkbox />}
            onChange={(e) => setUndercover(e.target.checked)}
          />
          {undercover && (
            <TextField
              required
              id="listing-height"
              label="Space Height"
              value={height}
              InputProps={{
                endAdornment: <InputAdornment position="end">m</InputAdornment>,
              }}
              onChange={(e) => setHeight(e.target.value)}
            />
          )}
          {thumbnailType === null && <br />}
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
            type="file"
            multiple
            id="listing-images"
            label="Listing Images"
            aria-label="Listing Images"
            helperText="Hold down the CTRL or SHIFT key to select multiple files"
            inputProps={{ multiple: true }}
            InputLabelProps={{ shrink: true }}
            onChange={(e) => {
              setImages(e.target.files);
            }}
          />
          <FormControlLabel
            id="listing-extra-images"
            label="Remove all extra listing images"
            checked={remove}
            control={<Checkbox />}
            onChange={(e) => setRemove(e.target.checked)}
          />
          <TextField
            required
            id="listing-price"
            label="Price per hour ($AUD)"
            value={price}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            onChange={(e) => setPrice(e.target.value)}
          />
          <br />
          <PrimaryButton name="Edit Listing" onClick={() => editListing()} />
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

export default EditListing;
