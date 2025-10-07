// How to use CustomApiModel

// ------------------------------
// 1. Define Payload and Response
// ------------------------------
// Importing all nessasary classes
import {
  BaseApiPayload,
  BaseApiResponse,
  CustomApiRequest,
  RequestMethod,
} from './ApiHelper';
import { API_ENDPOINTS } from '../../constants/api';
// And models
import { PostModel, UserModel } from './ApiModels';

// Example 1, Getting user by id_token provided by firebase

// u will need to define the paylaad and response needed for a api call
class GetUserByIdResponse extends BaseApiResponse {
  // this is the get fieldMapping in BaseApiResponse
  // we will need get fieldMapping method in this class inherit from this
  // so that all the value defined in parent class will be inherited
  //
  //   static get fieldMapping() {
  //     return {
  //       success: 'success',
  //       message: 'message',
  //       errors: 'errors',
  //     };
  //   }
  //
  // Define the extra field
  static get fieldMapping() {
    return {
      // this will inherit the fields from parent class
      ...super.fieldMapping,
      // add in the extra field needed
      data: 'data',
    };
  }

  /**
   * These will be hint for IDE, if a mismatched value is fed into this method
   * the IDE will complaint
   * But it is not nessary, if u confident can dont do this
   * @param {Object} options this allow this method to read JSON as input
   * @param {boolean} [options.success] this alr defined in base vlass
   * @param {string} [options.message] this alr defined in base vlass
   * @param {*} [options.errors] this alr defined in base vlass
   * @param {UserModel} [options.data] this will be the extra field
   * and more extra field if needed
   */
  constructor({ success, message, errors, data } = {}) {
    // Call the parent constructor first, these 3 data will be handle by parent constructor
    super({ success, message, errors });

    // after that need to handle the extra data
    // Convert raw JSON objects into UserModel instances
    // There are mulitple Model is defined in ApiModels.js can refer to that file if needed
    // Those model will auto convert JSON data into a Object, can just use them like a normal object
    if (data instanceof UserModel) {
      this.data = data;
    } else {
      this.data = UserModel.fromJson(data);
    }
    // or can simplfied to
    // this.data = data instanceof UserModel ? data : UserModel.fromJson(data);
  }
}

// do the same for payload
class GetUserByIdPayload extends BaseApiPayload {
  // Define the needed data
  static get fieldMapping() {
    return {
      // this will inherit from parent class
      ...super.fieldMapping,
      // add in the extra field needed
      id_token: 'id_token',
    };
  }

  /**
   * @param {Object} options
   * @param {String} [options.id_token]
   */
  constructor({ id_token } = {}) {
    // call the constructor from parent
    super();

    // assign extra values
    this.id_token = id_token;
  }
}

// Exmaple 2: get user posts
// this example is similar to previous exampple, but this response data will contain a list of PostModel
class GetUserPostsResponse extends BaseApiResponse {
  // Define the extra field
  static get fieldMapping() {
    return {
      // this will inherit the fields from parent class
      ...super.fieldMapping,
      // add in the extra field needed
      data: 'data',
    };
  }

  /**
   * @param {Object} options
   * @param {boolean} [options.success]
   * @param {string} [options.message]
   * @param {*} [options.errors]
   * @param {PostModel[]} [options.data] <-- note that it is a List instead of Object
   * and more extra field if needed
   */
  constructor({ status, success, message, errors, data } = {}) {
    super({ status, success, message, errors });

    // Convert raw JSON objects into PostModels instances
    if (Array.isArray(data)) {
      this.data = []; // start with an empty array

      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (item instanceof PostModel) {
          this.data.push(item);
        } else {
          this.data.push(PostModel.fromJson(item));
        }

        // or can use lamda for looping
        // this.data = data.map(item =>
        //   item instanceof PostModel ? item : PostModel.fromJson(item),
        // );
      }
    } else {
      this.data = [];
    }
  }
}

// do the same for payload
class GetUserPostsPayload extends BaseApiPayload {
  // Define the needed data
  static get fieldMapping() {
    return {
      // this will inherit from parent class
      ...super.fieldMapping,
      // add in the extra field needed
      id_token: 'id_token',
      count: 'count',
    };
  }

  /**
   * @param {Object} options
   * @param {String} [options.id_token]
   */
  constructor({ id_token, count } = {}) {
    // call the constructor from parent
    super();

    // assign extra values
    this.id_token = id_token;
    this.count = count;
  }
}

// ------------------------------
// 2. Constructing Objects
// ------------------------------

// this is the data needed for payload, for demo purpose i will assign it to a valid value
let id_token;

// can ignore from this line ----------------------------------
import InitFirebaseApps from '../firebase/InitFirebaseApps';
import { getAuth, getIdToken } from '@react-native-firebase/auth';

export default async function ApiHelperExample() {
  InitFirebaseApps();

  id_token = await getIdToken(getAuth().currentUser, false);
  // to this line ------------------------------------

  // create a payload for the request
  let getUserByIdPayload = new GetUserByIdPayload({ id_token: id_token });
  // create a request
  let getUserByIdRequest = new CustomApiRequest(
    RequestMethod.POST, //<-- this is the request method, defined in ./ApiHelper.RequestMethod
    API_ENDPOINTS.BASE_URL, //<-- this is the base url defined in ../constant/api
    API_ENDPOINTS.USER.GET_USER, //<-- this is the url path defined in ../constant/api
    getUserByIdPayload, //<-- this is the payload u just construct
    true, //<-- this is to decide whether need do attach appcheck token when sending request, most the case is needed, can just leave this field blank, it will auto assigned true
  );
  // send the request, note that await is always needed
  let getUserByIdResult = await getUserByIdRequest.sendRequest(
    // need to specify what response you are expecting
    // if not specfity it will use BaseApiResponse class which doesnt contain 'data' field and cause 'data' field in JSON data isnt serailized into response
    GetUserByIdResponse,
  );

  // after that u can use the data
  if (getUserByIdResult) {
    let getUserByIdResponse = new GetUserByIdResponse(
      getUserByIdRequest.Response,
    );

    const TAG = 'GetUserByIdRequest';
    console.log(`${TAG} status code: ${getUserByIdResponse.status}`);
    console.log(`${TAG} success: ${getUserByIdResponse.success}`);
    console.log(`${TAG} message: ${getUserByIdResponse.message}`);
    console.log(`${TAG} data: ${getUserByIdResponse.data}`);
    console.log(`${TAG} errors: ${getUserByIdResponse.errors}`);

    // and also the data in 'data' field
    let userData = new UserModel(getUserByIdResponse.data);
    console.log(`${TAG} username: ${userData.fullName}`);
    // and other fields also

    // if the request if failed or need do debugging
    // there is a logResponse method for viewing the raw data
    let log = getUserByIdRequest.logResponse();
    console.log(`${TAG} raw data: ${log}`);
  }

  // Exmaple 2
  // create a payload for the request
  let getUserPostsPayload = new GetUserPostsPayload({ id_token: id_token });
  // create a request
  let getUserPostsRequest = new CustomApiRequest(
    RequestMethod.POST,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.POST.GET_POST_BY_USER_ID,
    getUserPostsPayload,
    true,
  );
  // send the request, note that await is always needed
  let getUserPostsResult = await getUserPostsRequest.sendRequest(
    GetUserPostsResponse,
  );

  // after that u can use the data
  if (getUserPostsResult) {
    let getUserPostsResponse = new GetUserPostsResponse(
      getUserPostsRequest.Response,
    );

    const TAG = 'GetUserPostsRequest';
    console.log(`${TAG} status code: ${getUserPostsResponse.status}`);
    console.log(`${TAG} success: ${getUserPostsResponse.success}`);
    console.log(`${TAG} message: ${getUserPostsResponse.message}`);
    console.log(`${TAG} data: ${getUserPostsResponse.data}`);
    console.log(`${TAG} errors: ${getUserPostsResponse.errors}`);

    // the 'data' in this request will be a list, u can use it like normal list
    let postData = new PostModel(getUserPostsResponse.data[0]);
    console.log(`${TAG} data[0]: ${postData}`);

    // and also the field in the PostModel
    console.log(
      `${TAG} post_id in data[0]: ${getUserPostsResponse.data[0].postId}`,
    );

    // if the request if failed or need do debugging
    // there is a logResponse method for viewing the raw data
    let log = getUserPostsRequest.logResponse();
    console.log(`${TAG} raw data: ${log}`);
  }
}
