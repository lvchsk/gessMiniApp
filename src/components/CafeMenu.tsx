import './CafeMenu.styles.css'

interface Props {
  onPlay: () => void;
  onBack: () => void;
}

export default function CafeMenu({ onPlay, onBack }: Props) {
  return (
    <div className='cafe_menu'>
      <button className='btn_play' onClick={onPlay}>Играть</button>
      <button className='btn_back' onClick={onBack}>Назад</button>
    </div>
  );
}
