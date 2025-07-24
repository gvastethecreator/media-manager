import { AudioView } from './audio-view';

export { default as AudioContentView } from './audio-content-view';
export { AudioView } from './audio-view';

// Container component for conditional rendering
export const AudioViewContainer = () => {
	return <AudioView />;
};

export default AudioView;
