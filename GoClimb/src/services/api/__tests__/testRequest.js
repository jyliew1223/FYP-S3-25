// src/tests/testApiModels.js
import {
  UserModel,
  CragModel,
  PostModel,
  RouteModel,
  ClimbLogModel,
  PostLikeModel,
  CragModelsModel,
  ModelsRouteDataModel,
} from '../ApiModels';

function testModel(name, ModelClass, data) {
  test(`${name} parsing`, () => {
    const model = new ModelClass(data);
    expect(model).toBeDefined();
    // optionally, you can add property checks here
  });
}

// Example: mock backend JSON data (replace these with your real API responses)
const userJsonString = `
  {
    "user_id": "uFcHklPPBtaNztsYCGwiZt2wG2B3",
    "username": "Unnamed User",
    "email": "testuser002@gmail.com",
    "status": true,
    "profile_picture": "profile_pic.png",
    "profile_picture_url": "https://storage.googleapis.com/goclimb-39075.firebasestorage.app/users/uFcHklPPBtaNztsYCGwiZt2wG2B3/images/profile_pic.png?Expires=1761213912&GoogleAccessId=firebase-adminsdk-fbsvc%40goclimb-39075.iam.gserviceaccount.com&Signature=JY4GPZPnpa8w8NdCqd4qDcxBmjtokaK4xMk1gwH7bND8U68ZuViBM3Iwo%2BE4EFFddV5db0h3CwqSAcsAu6D1EVLSdjbaxtIjja251bYjPu%2BGbtW0mgrx6PlMGetoHIC0ysWC8XGQDUrsP7dXTUFC1IhcqP1UUIi73UTrCUHM82gQhug3DksZlI0YSJ2DUhEuT9yh6e44WsS5pixLuWdMg7hdjTk1ZFyR9SIXy4nJ%2B%2BqX0edQLJ3MzV7iLcrJtLQ0Xefh2g%2FlsIMRCZJIQkHPCJIlOe0bL2Mgfmjtvqq4RNLX%2FgEuc5PjhcgQUf2TxWNCwMO4b1idPJre2NVuEhA9UA%3D%3D"
  }
`;
const cragJsonString = `
  {
    "crag_id": "CRAG-000003",
    "name": "TestCrag001",
    "location_lat": 1.0,
    "location_lon": 1.0,
    "description": "some detail",
    "images_urls": [
      "https://storage.googleapis.com/goclimb-39075.firebasestorage.app/crags/CRAG-000003/images/image_0.png?Expires=1761211214&GoogleAccessId=firebase-adminsdk-fbsvc%40goclimb-39075.iam.gserviceaccount.com&Signature=XKSvtEOJj4dFi4tlJl6AOyvL3wzILoiH0MpSGOZ%2BLwZRcyrhAUdD5iVB%2FQXh%2BfWb6UUFJ2Zj70YZwK47%2BmsXzszwySkadY8CMmvyrKKDItk4heDJUj%2FpqgpQO9bVXFV9Ytxj%2FIQBHCnTjonkauBvL4%2B1HC6r2Fcw576ocOJZZH8r5B4Mm2nUcYM%2BRHpuAR1Ssx7IpN1U4hwyf%2B2oHqs3zmeqaT2IRgZGf93DKHVmt4e3cxB9yDjnpNtuGx0gVV4Fr%2BCUpr%2Bhj%2Fm%2FsK8jyYtmrMh37yeQGCc7HhaHUWql%2BOWlhC4z%2FLn0Xq7wwAaThtE7lj1lfhgK1zOSYv1D%2Fzffjg%3D%3D",
      "https://storage.googleapis.com/goclimb-39075.firebasestorage.app/crags/CRAG-000003/images/image_1.png?Expires=1761211214&GoogleAccessId=firebase-adminsdk-fbsvc%40goclimb-39075.iam.gserviceaccount.com&Signature=Jo3mGUKlJRFkEff7KEIZH%2Fa22CgZ9gOZ3cYvbyWOAPjy81ndADhkKk7lVmL9O5maUlBQFEFilq0kx0Pn%2FRYuuxZqxgYB%2BQIw9YcnkQkZChVBXL9wxhAaw9K%2Ff9K9GrzGxUyu7n9ChDT8D%2BZJQ8oXpXekiEuaAw0uJIxOChYPGgko9RarejoO92GMsRRkHq0pLq%2FQQKXRvoZPp52GYMkpjuYCACxsn8LJBB%2BlNP8vUjhKKBK9VjglZbGqrf6wWTLpAI85dT1IFRfb5rWnap7HxSHdjHu6zkhK5ubbPuqbejp4ywUvf6lhTZLy7LHsX%2Frzkx6L%2B1kCGG88Yh7v0UDHQQ%3D%3D",
      "https://storage.googleapis.com/goclimb-39075.firebasestorage.app/crags/CRAG-000003/images/image_2.png?Expires=1761211214&GoogleAccessId=firebase-adminsdk-fbsvc%40goclimb-39075.iam.gserviceaccount.com&Signature=P%2FzYU1wWiOpoTiublLSKI4K6IijPxq9pja1G3FsKcUQuPA%2FdPp9KwAb8B%2Bra5dBllbBzQoEka9d7U9xC3UHwYXsa5e%2BqucodFDnS91ycV0vbbJOvbuLJ0VmUpNDziuKqiWkzFRf3DynKfahqPFpUZuo9Z19CUY%2BDP2ReDJS6Sxl8WhjF2NY7tg2JIK%2BtQ73B4btJrFoZk8kIejAr0gQhEH43xelycnFUAHMpUCR6x5b0IVydSQN1m%2FrESn%2BjXPRqjqYZvoKtBjxgXJjxl1eC6QEIVdncACtT3pkORZJXxgj5SqP6Dkn8WOue9zinTR83wuG%2FVJ0jCwnRQoUujH0Hyg%3D%3D"
    ]
  }
`;
const cragModelJsonString = `
  {
    "model_id": "MODEL-000001",
    "crag": {
      "crag_id": "CRAG-000004",
      "name": "TestCrag002",
      "location_lat": 1.0,
      "location_lon": 1.0,
      "description": "some detail",
      "images_urls": [
        "https://storage.googleapis.com/goclimb-39075.firebasestorage.app/crags/CRAG-000004/images/image_0.png?Expires=1761211216&GoogleAccessId=firebase-adminsdk-fbsvc%40goclimb-39075.iam.gserviceaccount.com&Signature=OZ9znov3Zy9qnGfSIfZ2Nn%2BqVUVsghYho8HaXp6EjK9eJz08Uv6N409GomcIck9nap3YMm2kflP2ZAg4jeI6OWKzbRAaPcojXkwgu5r3B9AqCNvlmwziMCdfXxZrHrVnFMLPYc9kLXTplkkNWxrO65obwkRUyvvubgILloDPGcUffpOUKz7UZ4e3xsyObUQCnidbBiSkf3bAemJPBwF4wmLAkZl18HABIXP9O4w8LtYjNnWzq4RK7dPhB2CVIXOzdP0dlBXrvl222y43SNKflQNjOBtqf6jerIkVH2Kj1YJe4jwScLJZO3aVE7jyQSfwuivgBd9J6eBcaUDDmYIyJA%3D%3D",
        "https://storage.googleapis.com/goclimb-39075.firebasestorage.app/crags/CRAG-000004/images/image_1.png?Expires=1761211216&GoogleAccessId=firebase-adminsdk-fbsvc%40goclimb-39075.iam.gserviceaccount.com&Signature=OC9UwbNhIX6Y9%2F72dVBOm%2BkyW1Z9qK9PFvlkktxDm%2FltFP%2Fk5A8CNZc5bMAbtw4XRQCrv%2BxTPWRyQtNAhTkdMb4MRYDOBKTafV%2FcjnC1UTVHgvbOQdGZF22jyLmMS0Zn3NQpmBgRY4DB1p%2F0zDEOl%2FZEbDeYJhmeD%2F0SgPb6hbMHJhjMU%2F%2BAQvT8QlqtB1H9L%2F4xThNQ9pQ7bYfWBVntFrdA4eC7gqCL66cAiA9PtvXayiOqI9Nk8oN6y%2BkDxDZ2EKDlNWUrBfogfYhea0E1%2BO3zy6TZJSRFcbICh0gcEUpIfnG1BTKvFSWKPfX7D5RBD4uSPumd6sPMWHvGplKrGA%3D%3D",
        "https://storage.googleapis.com/goclimb-39075.firebasestorage.app/crags/CRAG-000004/images/image_2.png?Expires=1761211216&GoogleAccessId=firebase-adminsdk-fbsvc%40goclimb-39075.iam.gserviceaccount.com&Signature=zpQh0wWAIUIs2UvWgflkEluZbzC4k7Xi3f8JptSMFos3R5SBOKzt3d9suSArVu7BIe25FAD6liXpgPZFOpewwbz9Zke3TaaQfSqmG6cZb2zrpB5wd0daGPJDa0rRs2W9tY%2FC4jM6n%2FGqCBKShZrUjsxWCd0Jd7QxVwtrkCNtVquhxsmi9uRsVuXc4WbFlg8iDGsHWAyzT08u0o2kN4FOJ6b2Kiqm57dQLY7T8BK9SY%2BVlVwXUUzVOXMmYJ%2BSfMl8x2bRe4IaE8OtE72XGdiTru2KYsD52OmU%2Bs0B8g%2BPec20dKWV5eUo7YRHSjkErIJ%2FBuxTr3WJ%2BuLc4D2lMtfa1g%3D%3D"
      ]
    }
`;

const routeJsonString = `
  {
    "route_id": "ROUTE-000003",
    "route_name": "Route002",
    "route_grade": 2,
    "crag": 3,
    "images_urls": [
      "https://storage.googleapis.com/goclimb-39075.firebasestorage.app/crags/CRAG-000003/routes/ROUTE-000003/images/image_0.png?Expires=1761211217&GoogleAccessId=firebase-adminsdk-fbsvc%40goclimb-39075.iam.gserviceaccount.com&Signature=zm75ktTXJlPmz35PYrU5EmeStPiwYLY99%2FytMdR54FN2P9Hs3dvAqF5gorn9fvcrku8BEVNfh7Siu8OcJl92aP4Bax91CRly9EFOvH92YyNMkUqNEHtR5pzeoYkQKig1oMaeBHqhedHKH3mUMNtLyoh8iIyq9zjOgvCsqyOMxZpBSqx8bettUKxhA4aUW%2ByY3byZX4mTnMtLHw3PCvuJt%2Bp5%2BXnv3gjtxCxpWrwpH6yJnBUO5wefLFQRVfk3E3fWia5Py7e5bClUkeJAAFx6BituXFkX%2FdWhavGsYkP14qAMKDC4Wuz%2Fydc2O9bKBNp3ScV5fCtOcT5LP2Zvj%2FrO1A%3D%3D",
      "https://storage.googleapis.com/goclimb-39075.firebasestorage.app/crags/CRAG-000003/routes/ROUTE-000003/images/image_1.png?Expires=1761211217&GoogleAccessId=firebase-adminsdk-fbsvc%40goclimb-39075.iam.gserviceaccount.com&Signature=XTYqhF%2B5uN7Pm4bDhKJG3UwPIbhVnUMvkyAsaVCOrwfu3Q%2FBiDetrtdEkRhKEklm0pJeGiwvbgm5W%2FrrxZRdeISO6cMWt3%2Bb37tiqcyS9FcezGwcpEMiO7gOyy9s6MjlokIY2bSvmfZHuk6tkplSygwVztzhwFDctzPXtRNzz5y2L78xdTTWqs6l31V599gCwKCcGBnpDlghxvuVQ0Vq19OrwceRgXHNyLAfyVOoiR3NCdOIUlLjfJPgsKZC3RsSvc5Hlz4Apy5ec%2BPiJrQU2bMo9psDh3bePQYT9Ejgh6TbxfZ2%2Bk4VoqK948ywwhfowOTsW23Wgk1uJHHy8Vjk6w%3D%3D",
      "https://storage.googleapis.com/goclimb-39075.firebasestorage.app/crags/CRAG-000003/routes/ROUTE-000003/images/image_2.png?Expires=1761211217&GoogleAccessId=firebase-adminsdk-fbsvc%40goclimb-39075.iam.gserviceaccount.com&Signature=EcgRfEbPTzzxJlhrP1IYeiyAIvKQth7iDXXH1f0x%2FdFW53ZWkG057VVgie0pcohYVRgriRWK81NkOr4NsypzmQ5iQo3XBK1rTtGNe4C5ipQB2fty7DiAjy35Uwpk7M7XJeZSZOqTVjdQwP6uit%2F7IlhZYRRpoDBeARS1XLftpFbTaCj8Tq4QjXZ%2FHkow9BMsSFBaCzf%2B8cIG%2BPu%2Bl5BD6JoFYmfoba0QbOHL0JniSDWutMUD3Re36k9JGBHS90MUrXEv8kHkzZj7EVjLTIlxfeSL5HBjIOVTZVcTlQBuyYJPZLTsI%2FaZSP4yG6DYqrNvBq%2F0H5qVFZQvmtJMXH9H0g%3D%3D"
    ]
  }
`;
const postJsonString = `
  {
    "post_id": "POST-000007",
    "user": "jHm14Vvq2bcKmgNn8MizbFgdoyF2",
    "content": "some comment",
    "tags": [
      "some tag"
    ],
    "status": "active",
    "created_at": "2025-09-28T16:05:24.788295Z",
    "images_urls": [
      "https://storage.googleapis.com/goclimb-39075.firebasestorage.app/users/jHm14Vvq2bcKmgNn8MizbFgdoyF2/posts/POST-000007/images/image_1.png?Expires=1761211218&GoogleAccessId=firebase-adminsdk-fbsvc%40goclimb-39075.iam.gserviceaccount.com&Signature=mL%2FdFdOrs2%2BW4SnNlcSeyqSUIdT8s1kNmq0jVEP10o0Ijyi%2B4sfjmXbu%2F%2FaevfNuQY2AYookA1b6Ls6knNGOgZS5MHFuIpRQ5le1QJ0%2BE125biVkkuEgZWpjIuqwz2ZRsF3HYe%2BqyA0ulisp%2BAZQ49ogCY8y%2BWNthIWjEvcGnLE9SowHBE3ayOO%2FKyc5PrCBgp0QXhkydX5l24tueZpN33P3xEnYziI9jtSOooCO%2BZqfr23ChmSQhERSbInUdByenDlWfkOaTpo5Y%2FbHkR9ibkUAG%2FF8o1jp%2BhYMudSkO3dAw%2BCUbUG9HaP%2FYEVvDttldjIKwaswsz1BMiohLnWkXQ%3D%3D",
      "https://storage.googleapis.com/goclimb-39075.firebasestorage.app/users/jHm14Vvq2bcKmgNn8MizbFgdoyF2/posts/POST-000007/images/image_2.png?Expires=1761211218&GoogleAccessId=firebase-adminsdk-fbsvc%40goclimb-39075.iam.gserviceaccount.com&Signature=GjcFPUBz0uqSKF5r3Kk5KMF3T2kVch44Dahz1uJn1DROdjYpP2bUkVydvFL9zzQMGrUeigYk45J6D61BsOiBHcxhudy2WzXW9lUDK5fherB7%2BTrybeUMnmvjcI%2FJ5digkGqNGIApPYVtKbms2L567Ev6E3W5ZD91X0EiPmcUM8HycDgHtrTaFnD6bXqnjOcwZPjNZJte14VxDGvTb6CoYHPOZkEDC1cpDjmffpQIRuL0uB6UdxxTUktmhclYG0v93mqzAe1NM5aLz4BesKCnjGhDqywAXU1Z594aP1JtblU3Du6FHtDhvBFT7GqYv%2B4m8QCc3w3dzptExOzcywY3AQ%3D%3D",
      "https://storage.googleapis.com/goclimb-39075.firebasestorage.app/users/jHm14Vvq2bcKmgNn8MizbFgdoyF2/posts/POST-000007/images/image_3.png?Expires=1761211218&GoogleAccessId=firebase-adminsdk-fbsvc%40goclimb-39075.iam.gserviceaccount.com&Signature=xa9onnLaK8asKHHHSD9Jd8zckZ4sRo8sKrVz%2BuBX9M%2B0HgF97HPGMHNp4jPB%2ByexykMLwHogjsow53PsM2hYj0erAhY1JGGPOFnPk6ep3FLY9Tr9Hh33rNBnXM9qJmg3mrPjL8Cv2S1ue4y0ON3yrKdNUObfA97v5M1cgR42aBQkMPX0lZVGdPy1ptvAKsFikBj0LkOhKMQKiSAijrPZp3f4dBi%2BTNM%2Fl8ictIk%2F0qqRCG%2FZOZ2qk7UYkoUGK30br2ew1Od3wW3naT2r449YCio2Tbtu5M3jcVqYDAg0%2Bz%2FEBwNBEXuTBIEm65q%2F1LMKMog4m6wWBp9XArFs8GM5Cg%3D%3D"
    ]
  }
`;
const postLikeJsonString = `
  {
    "id": 1,
    "post": 8,
    "user": "KhlqGVT00idJPn8tT2PzH8C48eh2",
    "created_at": "2025-10-23T09:05:05.205827Z"
  }
`;
const modelRouteDataObj = {
  model_route_data_id: 'ROUTE_DATA-000001',
  model: {
    model_id: 'MODEL-000001',
    crag: {
      crag_id: 'CRAG-000004',
      name: 'TestCrag002',
      location_lat: 1.0,
      location_lon: 1.0,
      description: 'some detail',
      images_urls: [
        'https://storage.googleapis.com/goclimb-39075.firebasestorage.app/crags/CRAG-000004/images/image_0.png?...',
        'https://storage.googleapis.com/goclimb-39075.firebasestorage.app/crags/CRAG-000004/images/image_1.png?...',
        'https://storage.googleapis.com/goclimb-39075.firebasestorage.app/crags/CRAG-000004/images/image_2.png?...',
      ],
    },
    user: {
      user_id: 'uFcHklPPBtaNztsYCGwiZt2wG2B3',
      username: 'Unnamed User',
      email: 'testuser002@gmail.com',
      status: true,
      profile_picture: 'profile_pic.png',
      profile_picture_url:
        'https://storage.googleapis.com/goclimb-39075.firebasestorage.app/users/uFcHklPPBtaNztsYCGwiZt2wG2B3/images/profile_pic.png?...',
    },
    status: 'active',
    download_urls_json: {
      folder: 'crags/CRAG-000004/models/MODEL-000001/',
      files: [],
    },
  },
  route: {
    route_id: 'ROUTE-000003',
    route_name: 'Route002',
    route_grade: 2,
    crag: 3,
    images_urls: [
      'https://storage.googleapis.com/goclimb-39075.firebasestorage.app/crags/CRAG-000003/routes/ROUTE-000003/images/image_0.png?...',
      'https://storage.googleapis.com/goclimb-39075.firebasestorage.app/crags/CRAG-000003/routes/ROUTE-000003/images/image_1.png?...',
      'https://storage.googleapis.com/goclimb-39075.firebasestorage.app/crags/CRAG-000003/routes/ROUTE-000003/images/image_2.png?...',
    ],
  },
  user: {
    user_id: 'KhlqGVT00idJPn8tT2PzH8C48eh2',
    username: 'GoClimbCoolUser001',
    email: 'testuser001@gmail.com',
    status: true,
    profile_picture: 'profile_pic.png',
    profile_picture_url:
      'https://storage.googleapis.com/goclimb-39075.firebasestorage.app/users/KhlqGVT00idJPn8tT2PzH8C48eh2/images/profile_pic.png?...',
  },
  route_data: { point: 'asd' },
  status: 'active',
};
const climbLogJsonString = `
 {
    "log_id": "CLIMBLOG-000003",
    "user": {
      "user_id": "KhlqGVT00idJPn8tT2PzH8C48eh2",
      "username": "GoClimbCoolUser001",
      "email": "testuser001@gmail.com",
      "status": true,
      "profile_picture": "profile_pic.png",
      "profile_picture_url": "https://storage.googleapis.com/goclimb-39075.firebasestorage.app/users/KhlqGVT00idJPn8tT2PzH8C48eh2/images/profile_pic.png?Expires=1761213924&GoogleAccessId=firebase-adminsdk-fbsvc%40goclimb-39075.iam.gserviceaccount.com&Signature=iXYHMPqVfK8M2Rrn5YIRUJ24jggHTcE%2FqZAHkzHzAjFAWkDbxSPy%2FysdT03pCez01AdaT7HiFKj3Rv76kPBYd%2B9IWJcevtA5Hg30TQPde10nqWep8XF5cCu6VE4eyDYWKoXO1JfnScGmpJuS26%2FWUbLKJLIZsjqUe3flcyOigjTZViOTyjprraaQLXEOHeSWK508a%2FOz%2F9GW7uoEwPgjnvJ%2BMKsSp23u%2BU0rlDGrdAyIaSF4R4aYzlBwsKqklw8TTfYdWUXxepMyODROVic82TVxwgReroRNNkL5SCy58hI42qXw286pNELjkTfg0pVwPZpFZcdR72bTK1mUX5d6Tg%3D%3D"
    },
    "route": {
      "route_id": "ROUTE-000003",
      "route_name": "Route002",
      "route_grade": 2,
      "crag": 3,
      "images_urls": [
        "https://storage.googleapis.com/goclimb-39075.firebasestorage.app/crags/CRAG-000003/routes/ROUTE-000003/images/image_0.png?Expires=1761211225&GoogleAccessId=firebase-adminsdk-fbsvc%40goclimb-39075.iam.gserviceaccount.com&Signature=kGlog7HvaxGBh7QvItikXrcDOP0QZOjE87S%2BnSjG3FIQ0NUX%2FJco0FVDR6NbAVAEsf0ogddb6luDEkgnmj%2FYUomLSNMaaNk7dAptFVrPAJh6lRZW9Nzrrc0YAj9TpsiiGo9sEndcv1EvwhWoP8NbCXSUlOcfQdxLKrmnI0E96B9169WqCi2EWkJ9JtDWPFeWtOcEPvktJo5mmpeGylzkvLu66hD6APUSp2Ta2hsyQREqKJDS6vYqgBtSzIXg9lFF5x6nEbkWsCc%2B5QLeAzb5yqTE5l18lY7wS0ylNjmRieh4bEhK2BaQ4gYR01kMn5UlGaVnuyXXUk9K3IEzYegUEA%3D%3D",
        "https://storage.googleapis.com/goclimb-39075.firebasestorage.app/crags/CRAG-000003/routes/ROUTE-000003/images/image_1.png?Expires=1761211225&GoogleAccessId=firebase-adminsdk-fbsvc%40goclimb-39075.iam.gserviceaccount.com&Signature=tMNf9wOP0QYv6IgQTutbyyc8zqsgKKwxhUsuOmjVr5rIFfJ0hzqI%2FDQpmQEhE04WqX%2BgASxmC9CnjTrQ4UmmYB%2F9gJethOF5hkvQnwhgwuc2LySAx2f1RNwxu9iRi0XjdjWDbGyWU3Cvjv29lyHpzPucsbeGexWxJhBjl%2FXSIpUV%2FSOe3R1iK96B67Pc0atwPTXOc1Z2AKavWE37iMMNUxGmMhmc8rhldpqd5A8WRLvInu4zq4Q0ajNm4gY7%2BgkqSGnpWJIFtU9PG90T%2FGeDZfJLy%2BPc8%2BxHxB%2BWRZ6GacEc3gjIYHwgX0BNE8QJdDmCWXJ6TPu2J4b%2F8gqdQEw9%2Bg%3D%3D",
        "https://storage.googleapis.com/goclimb-39075.firebasestorage.app/crags/CRAG-000003/routes/ROUTE-000003/images/image_2.png?Expires=1761211225&GoogleAccessId=firebase-adminsdk-fbsvc%40goclimb-39075.iam.gserviceaccount.com&Signature=KCwbWWCgSwpaZLFE9vV85%2FtvAkkVDm8jXf0y9uc4za1CqO4%2B8tN3qdoidJq95mPsUNHMpXnRDnnKpzHLyp5%2FND2iZaeht4vJx%2BwJlXmmmT5nneEi04%2FHJnor1T1OXj3LWlVrCyn8DHzUKd8k%2Fxvb1qDkuv62gxTZaSmAdJ8QTh%2FL1XzheuEz93ZIkWj77yXoXYdorOxaAw7tWaW1tkm8DsIQx9CmgdHVQP0iBNSqUQdMVCU%2FIScQZyg71yE3BPnETPfdyyY9paTnA41WVDZ%2Fx9vG5h8XOLAXMYO7k8QOWCxwxTk5DuN6ApU%2BV0JCXg9v%2F5WimyFINjRseZPslLqiZw%3D%3D"
      ]
    },
    "date_climbed": "2025-09-28",
    "notes": ""
  }
`;

// Helper to safely parse JSON strings
function safeParse(jsonString, modelName) {
  try {
    // Remove control characters that can break JSON parsing
    const cleaned = jsonString.replace(/[\u0000-\u001F]+/g, '');
    return JSON.parse(cleaned);
  } catch (err) {
    console.error(`Failed to parse JSON for ${modelName}:`, err.message);
    return null;
  }
}

// Test all models safely
testModel('UserModel', UserModel, safeParse(userJsonString, 'UserModel'));
testModel('CragModel', CragModel, safeParse(cragJsonString, 'CragModel'));
testModel('RouteModel', RouteModel, safeParse(routeJsonString, 'RouteModel'));
testModel('PostModel', PostModel, safeParse(postJsonString, 'PostModel'));
testModel(
  'PostLikeModel',
  PostLikeModel,
  safeParse(postLikeJsonString, 'PostLikeModel'),
);
testModel('ModelsRouteDataModel', ModelsRouteDataModel, modelRouteDataObj);

testModel(
  'ClimbLogModel',
  ClimbLogModel,
  safeParse(climbLogJsonString, 'ClimbLogModel'),
);
