// GoClimb/src/services/firebase/FirebaseStorageHelper.js

/**
 * this file will contain functions for uplaoding file to firebase storage
 * each function is warpped with a namespace
 *  -> FirebaseStorageHelper
 * to avoid confusion
 *
 * when u need to use the funtion, import the namespace
 *  -> import FirebaseStorageHelper from 'relative/path/to/this/file'
 *
 * this namespace currently provides 2 function:
 *
 * -> FirebaseStorageHelper.uploadFileToFirebase(bucketDir, bucketFilename, filePath)
 *    -> bucketDir - a bucket is a root folder in firebase storage, so this will be the path u will upload the file to
 *    -> bucketFilename - the file name u want in firebase storage
 *    -> filePath - the local path to the file
 *
 * this function is use when u need to upload a single image, e.g. profile picture, post images
 * before using it u will need to get the bucket path from backend
 * when creating data entry, backend will return with a bucketDir which tell the frontend can store images to this dir
 * therfore u might need to do a for loop to upload all the images
 * 
 * {
 *  "folder":"posts/abc123/post-456"
 * }   <-- this is what backend will return ideally
 *
 * const images = [
 *   { name: "image1.png", path: "data/image" },
 *   { name: "image2.png", path: "data/image2" }
 * ];
 *
 * const data = request.data;   <-- u most likely will use CustomApiReqeust to send the request the 'data' will contain {"folder":"posts/abc123/post-456"}
 * const json = JSON.parse(data);
 * 
 * const bucketDir = json.folder
 *
 * foreach(const image in images){
 *    FirebaseStorage.uploadFileToFirebase(bucketDir, image.name, image.path)
 * }
 *
 *
 *
 * -> FirebaseStorageHelper.uploadFolderToFirebase(bucketBaseDir, localFolderPath)
 *    -> bucketBaseDir - same as bucketDir, this will be the parent folder of the uploading file in firebase storage
 *    -> localFolderPath - the local path of the folder u want to upload
 *
 * this function is mainly for files like 3D model which is have folder storing the model and its texture
 * same as uploading file u will need to get the bucketBaseDir from backend, after that use that dir in this function
 *
 * const bucketBaseDir = request.data;
 * const json = JSON.parse(data);
 * 
 * const bucketBaseDir = json.folder
 * 
 * FirebaseStorageHelper.uploadFolderToFirebase(bucketBaseDir, localFolderPath)
 *
 */

import RNFS from 'react-native-fs';
import { getStorage, ref, uploadBytes } from 'firebase/storage';

storage = getStorage();

/**
 * Upload a local file to Firebase Storage
 * @param {string} bucketDir - Folder in Firebase Storage, e.g. "crags/CRAG-000003/model"
 * @param {string} bucketFilename - File name to store in Firebase Storage, e.g. "Image_0.001.png"
 * @param {string|Blob|File} filePath - Local file path (RNFS path) or Blob/File
 */
export const uploadFileToFirebase = async (
  bucketDir,
  bucketFilename,
  filePath,
) => {
  // Normalize the folder path
  let safeDir = bucketDir;
  safeDir = bucketDir.replace(/^\/+|\/+$/g, '');

  const bucketPath = `${safeDir}/${bucketFilename}`;

  try {
    const fileRef = ref(storage, bucketPath);

    let fileBlob;
    if (typeof filePath === 'string') {
      const response = await fetch(`file://${filePath}`);
      fileBlob = await response.blob();
    } else {
      fileBlob = filePath;
    }

    await uploadBytes(fileRef, filePath);

    console.log('File uploaded successfully:');
  } catch (err) {
    console.error('Upload failed:', err);
  }
};

/**
 * Recursively upload a local folder to Firebase Storage
 * @param {string} localFolderPath - e.g. "/storage/emulated/0/GoClimb/crags/CRAG-000003"
 * @param {string} bucketBaseDir - Firebase folder to mirror locally, e.g. "crags/CRAG-000003"
 */
const uploadFolderToFirebase = async (bucketBaseDir, localFolderPath) => {
  const storage = getStorage();

  // Recursively get all files
  const getFilesRecursively = async folder => {
    let allFiles = [];
    const items = await RNFS.readDir(folder);

    for (const item of items) {
      if (item.isFile()) {
        allFiles.push(item.path);
      } else if (item.isDirectory()) {
        const nestedFiles = await getFilesRecursively(item.path);
        allFiles = allFiles.concat(nestedFiles);
      }
    }
    return allFiles;
  };

  const files = await getFilesRecursively(localFolderPath);

  for (const filePath of files) {
    try {
      // Compute relative path to preserve folder structure
      const relativePath = filePath.replace(`${localFolderPath}/`, '');
      const safeBucketBaseDir = bucketBaseDir.replace(/^\/+|\/+$/g, ''); // remove leading/trailing slash
      const bucketPath = `${safeBucketBaseDir}/${relativePath}`;

      const fileRef = ref(storage, bucketPath);

      // Convert local file to Blob
      const response = await fetch(`file://${filePath}`);
      const blob = await response.blob();

      await uploadBytes(fileRef, blob);

      console.log(`Uploaded: ${filePath}`);
    } catch (err) {
      console.error(`Failed to upload ${filePath}:`, err?.message || err);
    }
  }
};

const FirebaseStorageHelper = {
  uploadFileToFirebase,
  uploadFolderToFirebase,
};

export default FirebaseStorageHelper;
