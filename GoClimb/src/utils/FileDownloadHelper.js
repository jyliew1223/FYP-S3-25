// utils/FileDownloadHelper.js

/**
 * Download all files from a JSON folder structure.
 * 
 * this will only use for download a model to local(phone)
 * the backend will return a json which contains the download urls of every file in that folder
 * just directly pass in that json to this file, and it will download to ExternalDirectoryPath
 * 
 * -> 
 *
 * JSON example:
 * {
 *   "folder": "users/123/",
 *   "files": [
 *     {
 *       "name": "profile_pic.jpg",
 *       "path": "users/123/profile_pic.jpg",
 *       "download_url": "https://storage.googleapis.com/...profile_pic.jpg?...&X-Goog-Signature=..."
 *     },
 *     {
 *       "name": "resume.pdf",
 *       "path": "users/123/documents/resume.pdf",
 *       "download_url": "https://storage.googleapis.com/...resume.pdf?...&X-Goog-Signature=..."
 *     }
 *   ]
 * }
 */

import RNFS from 'react-native-fs';

import { LOCAL_DIR } from '../constants/folder_path';

export { downloadFolderFromJson };

const downloadFolderFromJson = async (
  json,
  options = { skipExisting: false },
) => {
  if (!json || !json.files || json.files.length === 0) {
    console.warn('No files to download.');
    return;
  }

  for (const file of json.files) {
    try {
      // Preserve nested structure
      const relativePath = file.path.replace(`${json.folder}`, ''); // e.g., "documents/resume.pdf"
      const localDest = `${LOCAL_DIR.BASE_DIR}/${json.folder}/${relativePath}`;

      // Extract folder path and create it
      const localDir = localDest.substring(0, localDest.lastIndexOf('/'));

      const folderExists = await RNFS.exists(localDir);
      if (!folderExists) await RNFS.mkdir(localDir);

      // Check if file exists
      const exists = await RNFS.exists(localDest);
      if (exists && options.skipExisting) {
        console.log(`Skipped existing file: ${localDest}`);
        continue;
      }

      // Download file
      console.log(`Downloading ${file.name} → ${localDest}`);
      const ret = RNFS.downloadFile({
        fromUrl: file.download_url,
        toFile: localDest,
        background: true,
        // discretionary: true, // optional for iOS
      });

      const result = await ret.promise;

      if (result.statusCode === 200) {
        console.log(`Downloaded successfully: ${localDest}`);
      } else {
        console.warn(
          `Failed to download ${file.name}. Status code: ${result.statusCode}\n` +
            `Raw result: ${JSON.stringify(result, null, 2)}`,
        );
      }
    } catch (err) {
      console.error(`Error downloading ${file.name}:`, err);
    }
  }
};
