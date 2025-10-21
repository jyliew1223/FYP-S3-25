// utils/FileDownloadHelper.js
import RNFS from 'react-native-fs';

/**
 * Download all files from a JSON folder structure.
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
export const downloadFolderFromJson = async (
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
      const localDest = `${RNFS.ExternalDirectoryPath}/${json.folder}/${relativePath}`;

      // Extract folder path and create it
      const localDir = localDest.substring(0, localDest.lastIndexOf('/'));
      await RNFS.mkdir(localDir);

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
          `Failed to download ${file.name}. Status code: ${result.statusCode}`,
        );
      }
    } catch (err) {
      console.error(`Error downloading ${file.name}:`, err);
    }
  }
};
