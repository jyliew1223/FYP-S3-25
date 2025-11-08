import { LOCAL_DIR } from '../constants/folder_path';

import RNFS from 'react-native-fs';

export async function findCragFolder(modelId) {
  const cragsDir = `${LOCAL_DIR.BASE_DIR}/crags`;
  const folders = await RNFS.readDir(cragsDir); // get list of subfolders
  for (const folder of folders) {
    const modelPath = `${folder.path}/models/${modelId}/`;
    const exists = await RNFS.exists(modelPath);
    if (exists) {
      console.log('✅ Found:', modelPath);
      return modelPath;
    }
  }
  console.log('❌ Folder not found');
  return null;
}
