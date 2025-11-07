import { LOCAL_DIR } from '../constants/folder_path';

import RNFS from 'react-native-fs';

export async function findCragFolder(modelId) {
  try {
    const cragsDir = `${LOCAL_DIR.BASE_DIR}/crags`;
    
    // Check if crags directory exists, create if not
    const cragsDirExists = await RNFS.exists(cragsDir);
    if (!cragsDirExists) {
      console.log('📁 Crags directory does not exist, creating it...');
      await RNFS.mkdir(cragsDir);
      console.log('✅ Crags directory created');
      return null; // No models yet since we just created the directory
    }
    
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
  } catch (error) {
    console.log('❌ Error checking for model folder:', error.message);
    return null;
  }
}
