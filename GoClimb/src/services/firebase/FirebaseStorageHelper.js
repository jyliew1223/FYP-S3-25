// GoClimb/src/services/firebase/FirebaseStorageHelper.js

import { getApp } from '@react-native-firebase/app';
import {
  getStorage,
  ref,
  getDownloadURL,
  listAll,
  getMetadata,
} from '@react-native-firebase/storage';
import RNFS from 'react-native-fs';

const storage = getStorage(getApp());

const withBase = (base, endpoints) => {
  const obj = {};
  for (const [key, value] of Object.entries(endpoints)) {
    if (typeof value === 'object' && value !== null) {
      obj[key] = withBase(base, value);
    } else {
      obj[key] = `${base}${value}`;
    }
  }
  return obj;
};

const getBucketDir = (id, secondID = null) => ({
  USER: withBase(`users/${id}/`, {
    IMAGE: 'images/',
  }),
  CRAG: withBase(`crags/${id}/`, {
    IMAGE: 'images/',
    ROUTE: withBase(`routes/${secondID}/`, {
      IMAGE: 'images/',
    }),
    MODEL: `models/${secondID}/`,
  }),
  POST: withBase(`posts/${id}/`, {
    IMAGE: 'images/',
  }),
});

// For fetching file URL from Firebase Storage
// can use for displaying images, e.g.,
/* <Image
  source={{ uri: url }}
  style={{ width: 200, height: 200, borderRadius: 10 }}
/> */
/**
 * @param {string} fileRef - Path in Firebase Storage bucket
 * @returns {string} - Download URL of the file
 */
async function getUrl(fileRef) {
  try {
    const url = await getDownloadURL(fileRef);
    console.log('File URL:', url);
    return url;
  } catch (error) {
    console.error('Error fetching file URL:', error);
    return null;
  }
}

// For downloading single file from Firebase Storage
/**
 * @param {string} bucketPath - Path in Firebase Storage bucket
 * @returns {string} - Local file path where the file is downloaded
 */
async function downloadFile(bucketPath) {
  try {
    const fileRef = ref(storage, bucketPath);
    const url = await getDownloadURL(fileRef);

    const localPath = `${RNFS.ExternalDirectoryPath}/storage/${bucketPath}`;
    const localDir = localPath.substring(0, localPath.lastIndexOf('/'));

    // Create all folders recursively
    await RNFS.mkdir(localDir);

    const result = await RNFS.downloadFile({
      fromUrl: url,
      toFile: localPath,
    }).promise;

    if (result.statusCode === 200) {
      console.log('✅ File downloaded to:', localPath);
      return localPath;
    } else {
      console.error('❌ Download failed with status:', result.statusCode);
      return null;
    }
  } catch (error) {
    console.error('⚠️ Error downloading file:', error);
    return null;
  }
}

// For downloading entire folder from Firebase Storage
/**
 * @param {string} bucketFolderPath - Path in Firebase Storage bucket
 * @returns {string} - Local folder path where the folder is downloaded
 */
async function downloadFolder(bucketFolderPath) {
  try {
    const folderRef = ref(storage, bucketFolderPath);
    const res = await listAll(folderRef);

    // Download all files in this folder
    for (const item of res.items) {
      downloadFile(item.fullPath);
    }

    // Recursively handle subfolders in parallel
    const subFolderResults = await Promise.all(
      res.prefixes.map(async (subFolder) => {
        try {
          const result = await downloadFolder(subFolder.fullPath);
          if (!result) {
            console.error('⚠️ Error downloading subfolder:', subFolder.fullPath);
            return false;
          }
          return true;
        } catch (err) {
          console.error('⚠️ Exception downloading subfolder:', subFolder.fullPath, err);
          return false;
        }
      })
    );

    // Determine overall success
    const isSuccess = subFolderResults.every(r => r === true);

    if (isSuccess) {
      console.log(`✅ Folder downloaded successfully: ${bucketFolderPath}`);
    }

    return isSuccess;
  } catch (error) {
    console.error('⚠️ Error downloading folder:', error);
    return false;
  }
}

// For getting profile image URL
/**
 * @param {string} userId
 * @returns {string[]} - Download URLs of the file
 */
async function getProfileImageUrls(userId) {
  
  console.log('Fetching profile images for user:', userId);

  const dir = getBucketDir(userId).USER.IMAGE;

  console.log('Looking in directory:', dir);

  const folderRef = ref(storage, dir);

  try {
    const list = await listAll(folderRef);

    console.log('Files found:', list.items.length);

    const itemList = list.items.map(async fileRef => {
      try {
        const meta = await getMetadata(fileRef);
        if (meta.customMetadata?.purpose === 'profile_picture') {
          return await getUrl(fileRef);
        }
      } catch (err) {
        console.error(
          'Error getting metadata for file:',
          fileRef.fullPath,
          err,
        );
        return null;
      }
    });

    const urls = await Promise.all(itemList).then(results =>
      results.filter(url => url !== null),
    );

    return urls;
  } catch (err) {
    console.error('Error listing files:', err);
    return [];
  }
}

// For getting crag image URL
/**
 * @param {string} cragId
 * @returns {string[]} - Download URLs of the file
 */
async function getCragImageUrls(cragId) {
  console.log('Fetching crag images for crag:', cragId);

  const dir = getBucketDir(cragId).CRAG.IMAGE;

  console.log('Looking in directory:', dir);

  const folderRef = ref(storage, dir);

  try {
    const list = await listAll(folderRef);

    console.log('Files found:', list.items.length);

    const itemList = list.items.map(async fileRef => {
      try {
        const meta = await getMetadata(fileRef);
        if (meta.customMetadata?.purpose === 'crag_image') {
          return await getUrl(fileRef);
        }
      } catch (err) {
        console.error(
          'Error getting metadata for file:',
          fileRef.fullPath,
          err,
        );
        return null;
      }
    });

    const urls = await Promise.all(itemList).then(results =>
      results.filter(url => url !== null),
    );

    return urls;
  } catch (err) {
    console.error('Error listing files:', err);
    return [];
  }
}

// For getting routes image URL ( Note: Route Model(ApiModel) will contain its crag data represented in Crag Model )
/**
 * @param {string} cragId
 * @param {string} routeId
 * @returns {string[]} - Download URLs of the file
 */
async function getRouteImageUrls(cragId, routeId) {
  console.log('Fetching route images for crag:', cragId, 'and route:', routeId);

  const dir = getBucketDir(cragId, routeId).CRAG.ROUTE.IMAGE;

  console.log('Looking in directory:', dir);

  const folderRef = ref(storage, dir);

  try {
    const list = await listAll(folderRef);

    console.log('Files found:', list.items.length);

    const itemList = list.items.map(async fileRef => {
      try {
        const meta = await getMetadata(fileRef);
        if (meta.customMetadata?.purpose === 'route_image') {
          return await getUrl(fileRef);
        }
      } catch (err) {
        console.error(
          'Error getting metadata for file:',
          fileRef.fullPath,
          err,
        );
        return null;
      }
    });

    const urls = await Promise.all(itemList).then(results =>
      results.filter(url => url !== null),
    );

    return urls;
  } catch (err) {
    console.error('Error listing files:', err);
    return [];
  }
}

// For getting posts image URL
/**
 * @param {string} postId
 * @returns {string[]} - Download URLs of the file
 */
async function getPostImageUrls(postId) {
  console.log('Fetching post images for post:', postId);

  const dir = getBucketDir(postId).POST.IMAGE;

  console.log('Looking in directory:', dir);

  const folderRef = ref(storage, dir);

  try {
    const list = await listAll(folderRef);

    console.log('Files found:', list.items.length);

    const itemList = list.items.map(async fileRef => {
      try {
        const meta = await getMetadata(fileRef);
        if (meta.customMetadata?.purpose === 'post_image') {
          return await getUrl(fileRef);
        }
      } catch (err) {
        console.error(
          'Error getting metadata for file:',
          fileRef.fullPath,
          err,
        );
        return null;
      }
    });

    const urls = await Promise.all(itemList).then(results =>
      results.filter(url => url !== null),
    );

    return urls;
  } catch (err) {
    console.error('Error listing files:', err);
    return [];
  }
}

// For downloading crag model
/**
 * @param {string} cragId
 * @param {string} modelId
 * @returns {string} - Local path of the downloaded file
 */
async function downloadCragModel(cragId, modelId) {
  console.log('Fetching crag model for crag:', cragId, 'and route:', modelId);

  const dir = getBucketDir(cragId, modelId).CRAG.MODEL;

  console.log('Looking in directory:', dir);

  try {
    downloadFolder(dir);
  } catch (err) {
    console.error('Error listing files:', err);
    return [];
  }
}

const FirebaseStorageHelper = {
  getProfileImageUrls,
  getCragImageUrls,
  getRouteImageUrls,
  getPostImageUrls,
  downloadCragModel,
};
export default FirebaseStorageHelper;
