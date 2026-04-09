interface Props {
  score: number;
  onExit: () => void;
}

export default function GameUI({ score, onExit }: Props) {
  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <button onClick={onExit}>← Назад</button>
        <div>Score: {score}</div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    pointerEvents: 'none' as const
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px',
    pointerEvents: 'auto' as const
  }
};