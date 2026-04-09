import './MainMenu.styles.css'

interface Props {
  onStart: () => void;
  user?: string
}

export default function MainMenu({ onStart, user }: Props) {
  return (
    <div className='container'>
      <h1>Привет, {user}</h1>
      <button className='btn' onClick={onStart}>Играть</button>
    </div>
  );
}
