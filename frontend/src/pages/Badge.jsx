import React from 'react';
import Header from '../components/Header';
import { apiRequest } from '../Api';
import ShootEmojis from '../components/ShootEmojis';

const Badge = () => {
  const [clicked, setClicked] = React.useState(false);
  localStorage.setItem('page', 'Secret Badge');
  document.title = 'Secret Badge';

  React.useEffect(() => {
    apiRequest('badge/add_badge_to_current_user?type_id=18', undefined, 'PUT')
      .then(() => {
        setClicked(true);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <Header />
      <div>You have found a badge!</div>
      {clicked && (
        <ShootEmojis
          emojis={['👩‍💻']}
          complete={() => {
            setClicked(false);
          }}
        />
      )}
    </>
  );
};

export default Badge;
