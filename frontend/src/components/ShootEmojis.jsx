import React from 'react';
import { useReward } from 'react-rewards';
import PropTypes from 'prop-types';

const ShootEmojis = ({ emojis, complete }) => {
  const { reward, isAnimating } = useReward('rewardId', 'emoji', {
    emoji: emojis,
    lifetime: 100,
    elementCount: 200,
    elementSize: 30,
    spread: 360,
    onAnimationComplete: complete,
  });

  React.useEffect(() => {
    if (emojis.length !== 0) {
      reward();
    } else {
      complete();
    }
  }, []);

  return (
    <button
      disabled={isAnimating}
      onClick={reward}
      id="rewardId"
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        padding: '0',
        border: '0',
      }}
    ></button>
  );
};

ShootEmojis.propTypes = {
  /** The list of emojis being displayed  */
  emojis: PropTypes.array.isRequired,
  /** The function to be run when completed  */
  complete: PropTypes.func.isRequired,
};

export default ShootEmojis;
