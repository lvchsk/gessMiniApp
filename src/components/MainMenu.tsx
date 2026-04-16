import './MainMenu.styles.css';

interface Props {
  onStart: () => void;
  user?: string;
}

export default function MainMenu({ onStart, user }: Props) {
  return (
    <div className='container'>
      <button className='main_menu__start_hitbox' onClick={onStart} aria-label='Играть'>
        <span className='main_menu__sr_only'>Играть</span>
      </button>
      <h1 className='main_menu__greeting'>Привет, {user}</h1>
    </div>
  );
}
