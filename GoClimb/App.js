// GoClimb/App.js

import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext'; 

import { downloadFolderFromJson } from './src/utils/FileDownloadHelper';
import InitFirebaseApps from './src/services/firebase/InitFirebaseApps';

const json = `
{
    "folder": "crags/CRAG-000003/model/MODEL-000001/",
    "files": [
        {
            "name": "Image_0.001.png",
            "path": "crags/CRAG-000003/model/MODEL-000001/Image_0.001.png",
            "download_url": "https://storage.googleapis.com/goclimb-39075.firebasestorage.app/crags/CRAG-000003/model/MODEL-000001/Image_0.001.png?Expires=1761062160&GoogleAccessId=firebase-adminsdk-fbsvc%40goclimb-39075.iam.gserviceaccount.com&Signature=QeqLAH9dHbzEZnWTvj1cFLT7jk1BNO2UFfCxJoAktjssMMJe5QRzQ4OdY2kmPG%2B9em4G6sENhX36IrvyJ5Llt9zbByULCwHuL9D%2FUuWojglc3wo0xujU8N6NbItkc8fB4jof1VY1zr3AHUKDMCk9OfWiaWn0aIUf%2FdU%2BMHIRU1fk%2FKZX6o5QsT3rRLPWgz%2F3kpkRq1JiwcvTZijC%2FmIES%2BXvtKRNQNz6pNtdu1%2BTFmvTs1Lj9hdlX8eiN2egjr%2FMmHIJLHFVh9%2BhcTRdBdveXJ4jpXQ3MAbp2PtAs4gzWE7%2Bm4EzlV1U%2FppUwzD2oNbqcKy80LBq5ZvdjZBzZq6LJA%3D%3D"
        },
        {
            "name": "Image_1.001.png",
            "path": "crags/CRAG-000003/model/MODEL-000001/Image_1.001.png",
            "download_url": "https://storage.googleapis.com/goclimb-39075.firebasestorage.app/crags/CRAG-000003/model/MODEL-000001/Image_1.001.png?Expires=1761062160&GoogleAccessId=firebase-adminsdk-fbsvc%40goclimb-39075.iam.gserviceaccount.com&Signature=y5bvMJVHMTKoC9T8X9YlFj8q8by%2FTnjnPKHXmxVh9beLFEP66rfK%2BfE7JFfINs6fSqE6bMaXhA5dkNuAtuVM6psrbyJsWJ%2BAgY3hRnvOYo3htD43JPNYSw%2B6xR1wGCDZ%2F0Ms%2FTsRqcVWaranKhXMM95PqPdYEcnBVEcv6RebpHc8zQ7NEA%2FiP4%2BHJL9LwxaamJS3VmerVsqgTX%2ButFbos1oXYe86nMuZbm2bCrWjI2NOGidqxXnBwz6sAkSDhEzfdHfRPCZYcniW7gN0lQEwG%2Fl0Jn2rY7p7rah2yifC2ID6IvdNbafj4wGtolUexxtfsPcBvYlsP9wr3%2BuWHG9nYw%3D%3D"
        },
        {
            "name": "TestModel.fbx",
            "path": "crags/CRAG-000003/model/MODEL-000001/TestModel.fbx",
            "download_url": "https://storage.googleapis.com/goclimb-39075.firebasestorage.app/crags/CRAG-000003/model/MODEL-000001/TestModel.fbx?Expires=1761062160&GoogleAccessId=firebase-adminsdk-fbsvc%40goclimb-39075.iam.gserviceaccount.com&Signature=rNMzT6cv%2FX5NqyJn7xhmDUzksdtwQHhzGQcOUlY%2F8%2F3Kft%2BumhvK%2BraSP2qukgXiklVeU3xB2Sp9rQDq0tYZgvak3Ehv9zG8Pot98lCH6AkVaXyfdVOx9ih71zSkaUcUsCw9Y%2FzGxD%2Fj%2BFk2lRtXqrT%2FkG2zszVkTXAIYYV%2BuIgMRy79YpPjSdusjF%2Bz%2BxtNDdukHllx8km5%2BVIhkyLzNmT7R1JRiLOz5HyhrnCeR%2BXP8u%2BHqR6wbQuLouqO1hJfOYd5JLa35R9eFCPS5JOx72WbRb%2FwWn9eb%2Fog2iFo9CDzKXBF3TrzKhfrZmyw0Mj0pf%2FQV8v2cUYMyIByaeEH8A%3D%3D"
        },
        {
            "name": "test.glb",
            "path": "crags/CRAG-000003/model/MODEL-000001/test.glb",
            "download_url": "https://storage.googleapis.com/goclimb-39075.firebasestorage.app/crags/CRAG-000003/model/MODEL-000001/test.glb?Expires=1761062160&GoogleAccessId=firebase-adminsdk-fbsvc%40goclimb-39075.iam.gserviceaccount.com&Signature=dNRMkW1T1ajNq0NhyUFpVGRHgG22xclZBDgo%2F6cnuw1%2FNrcWFYNfne41LVzhWQS0d0vV1B0V4gZ06QhnIP6ufW07lplJOZGq5J9WWIDIHN%2FR2vkc7aA9j3LB2dnq1O7ZNDZ6yZxZtogkKZ2VRtPDV8q1p2b2Z3bqiBVJhcbmwNjBTNw9RuBCjhrE0wcc34VmCzBRY0Jrd3qT8gdiGUmyotHb5KTOpkPDBMd7gn0SYAZ90F59Du9Tdc3W5uP%2FKMuluGUZOpLVXObU%2BQl59rfqxauPtUyUbXWwj1x2t4O4FVaU46XBQslKEI9CEy9rI3iVXR%2Fh1ZmDbyrqNTUTeqoHcQ%3D%3D"
        }
    ]
}

`;

function AppInner() {
  const { navTheme } = useTheme();

  useEffect(() => {
    // Initialize Firebase in background without blocking UI
    InitFirebaseApps().catch(error => {
      console.log('Firebase initialization failed:', error);
    });
  }, []);

  return <RootNavigator navTheme={navTheme} />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppInner />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
