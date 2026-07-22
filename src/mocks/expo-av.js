// Mock web pour expo-av — sons non supportés sur web
export const Audio = {
  setAudioModeAsync: async () => {},
  Sound: {
    createAsync: async () => ({
      sound: {
        playAsync: async () => {},
        stopAsync: async () => {},
        setPositionAsync: async () => {},
        unloadAsync: async () => {},
        setOnPlaybackStatusUpdate: () => {},
      },
    }),
  },
};

export const Video = {};
export const AVPlaybackStatus = {};
