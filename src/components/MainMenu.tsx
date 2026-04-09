import './MainMenu.css'

interface Props {
  onStart: () => void;
}

export default function MainMenu({ onStart }: Props) {
  return (
    <div className='container'>
      <button className='btn' onClick={onStart}>Играть</button>
    </div>
  );
}

// const styles = {
//   container: {
//     display: 'flex',
//     flexDirection: 'column' as const,
//     alignItems: 'center',
//     justifyContent: 'center',
//     height: '100vh',
//     gap: '20px',
//   }
// };