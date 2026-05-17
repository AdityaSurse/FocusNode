export const playSound = (type: 'start' | 'complete' | 'click') => {
  const sounds = {
    start: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // Industrial ping
    complete: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Sci-fi chime
    click: 'https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3', // Mechanical click
  };

  const audio = new Audio(sounds[type]);
  audio.volume = 0.2;
  audio.play().catch(() => {
    // Autoplay policy might block this if user hasn't interacted
  });
};
