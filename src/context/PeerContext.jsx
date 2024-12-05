import React, { createContext, useContext, useState } from 'react';

const PeerContext = createContext();

export const usePeer = () => useContext(PeerContext);

export const PeerProvider = ({ children }) => {
  const [peerNickname, setPeerNickname] = useState(null);
  const [peerProfileImage, setPeerProfileImage] = useState(null);

  return (
    <PeerContext.Provider value={{ peerNickname, setPeerNickname, peerProfileImage, setPeerProfileImage }}>
      {children}
    </PeerContext.Provider>
  );
};
