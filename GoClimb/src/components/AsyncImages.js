// components/AsyncImages.js

/*
 * This file will contain the components related to asynchronously fetching and displaying images from Firebase Storage.
 * When the image URLs are being fetched, a placeholder image will be shown.
 *
 * Components:
 * AsyncImageProvider
 * -> A component that fetches image URLs asynchronously and provides them to its children
 * -> It support custom container for displaying images
 * -> It takes 3 input:
 *  - fetchUrls: async function that fetches image URLs
 *  - placeholder: image to show while loading (default is GoClimb logo)
 *  - children: function that receives the image URLs and returns the component to render
 * -> fetchUrls function should return an array of image URLs (there is already multiple function in service/firebase/FirebaseStorageHelper.js for fetching image URLs)
 * -> Example usage: see PostImages component below
 *
 * ProfileImage
 * -> A component that displays a user's profile image fetched from Firebase Storage
 *
 * Can add more components like CragImage, etc. as needed
 */

import React, { useState, useEffect } from 'react';
import { ScrollView, Image, View } from 'react-native';
import FirebaseStorageHelper from '../services/firebase/FirebaseStorageHelper';

import { IMAGES } from '../constants/images';

const AsyncImageProvider = ({
  placeholder = IMAGES.PLACEHOLDER,
  urls = [],
  children,
}) => {
  const [imageUrls, setImageUrls] = useState([]);

  useEffect(() => {
    if (!urls || urls.length === 0) return;

    const loadedImages = [];
    let loadedCount = 0;

    urls.forEach((url, index) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        loadedImages[index] = url;
        loadedCount++;
        if (loadedCount === urls.length) {
          setImageUrls(loadedImages);
        }
      };
      img.onerror = () => {
        loadedImages[index] = placeholder; // fallback if failed
        loadedCount++;
        if (loadedCount === urls.length) {
          setImageUrls(loadedImages);
        }
      };
    });
  }, [urls, placeholder]);

  return children(imageUrls.length > 0 ? imageUrls : [placeholder]);
};

// Example usage of AsyncImageProvider for Post Images
const AsyncImages = ({ imageUrls }) => {
  return (
    <AsyncImageProvider urls={imageUrls} placeholder={IMAGES.PLACEHOLDER}>
      {urls => (
        <div style={{ display: 'flex', gap: '10px' }}>
          {urls.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={`img-${idx}`}
              width={100}
              height={100}
            />
          ))}
        </div>
      )}
    </AsyncImageProvider>
  );
};

const ProfileImage = ({ userId, placedHolder = IMAGES.PLACEHOLDER }) => {
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchImages = async () => {
      try {
        const urls = await FirebaseStorageHelper.getProfileImageUrls(userId);
        if (isMounted && urls.length > 0) {
          setImageUrl(urls[0]);
        }
      } catch (err) {
        console.error('Error fetching profile image:', err);
      }
    };

    fetchImages();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return (
    <Image
      source={imageUrl ? { uri: imageUrl } : placedHolder}
      style={{ width: 100, height: 100 }}
    />
  );
};

export { AsyncImageProvider, ProfileImage };
