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

  const roomName = useMemo(
    () => decodeRoomName(encodedRoomName),
    [encodedRoomName]
  );

  return { roomName, encodeRoomName, decodeRoomName };
};
