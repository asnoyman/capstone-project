import React from 'react';
import '../App.css';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../Api';
import Cookies from 'js-cookie';
import Header from '../components/Header';
import PrimaryButton from '../components/PrimaryButton';

const Reviews = () => {
  const listingId = window.location.href.split('/')[4];
  const [reviews, setReviews] = React.useState([]);
  const [loaded, setLoaded] = React.useState(false);
  const navigate = useNavigate();
  document.title = 'Reviews';
  localStorage.setItem('page', 'Reviews');

  /**
   * If the user is not logged in, navigate to the home page.
   * Otherwise, load the reviews for the listing.
   */
  React.useEffect(() => {
    if (Cookies.get('token') !== undefined) {
      apiRequest(`listing/${listingId}/review/all`, undefined, 'GET')
        .then((reviews) => {
          setLoaded(true);
          setReviews(reviews);
        })
        .catch((error) => {
          console.log(error);
          navigate('/');
          navigate(0);
        });
    } else {
      navigate('/');
      navigate(0);
    }
  }, [listingId, navigate]);

  /** Display all reviews for the given listing */
  const showReviews = () => {
    const formattedReviews = [];
    for (const value of [5, 4, 3, 2, 1]) {
      const filteredReviews = reviews.reviews.filter((review) => {
        return review.rating === value;
      });

      formattedReviews.push(
        <>
          <div style={{ textDecoration: 'underline' }}>{value} Star Reviews:</div>
          <br />
          <div>
            {filteredReviews.length === 0
              ? `No ${value} Star Reviews`
              : filteredReviews.map((review, i) => (
                  <div key={`${value} - ${i}`}>
                    {review.name}: {review.review === '' ? 'No Comment' : `"${review.review}"`}
                  </div>
                ))}
          </div>
          <br />
        </>
      );
    }
    return formattedReviews;
  };

  return (
    loaded && (
      <>
        <Header />
        <div style={{ margin: '80px 0px 0px 40px' }}>
          {showReviews()}
          <PrimaryButton
            name="View Listing"
            onClick={() => navigate(`/view_listing/${listingId}`)}
          />
        </div>
      </>
    )
  );
};

export default Reviews;
