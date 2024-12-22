import { useMemo } from 'react';

export const useRoomName = encodedRoomName => {
  const decodeRoomName = encoded => {
    try {
      return atob(encoded); // Base64 디코딩
    } catch (error) {
      console.error('Failed to decode room name:', error);
      return null;
    }
  };

  const encodeRoomName = roomName => {
    try {
      return btoa(roomName); // Base64 인코딩
    } catch (error) {
      console.error('Failed to encode room name:', error);
      return null;
    }
  };

  const roomName = useMemo(() => {
    if (!encodedRoomName) {
      console.warn('No room name provided for decoding.');
      return null;
    }

    const decodedName = decodeRoomName(encodedRoomName);
    if (!decodedName) {
      console.warn('Decoded room name is invalid:', encodedRoomName);
      return null;
    }

    return decodedName;
  }, [encodedRoomName]);

  return { roomName, encodeRoomName, decodeRoomName };
};
