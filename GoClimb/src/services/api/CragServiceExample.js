// GoClimb/src/services/api/CragService.js

// import needed functions and classes
import {
  CustomApiRequest,
  RequestMethod,
  BaseApiPayload,
  BaseApiResponse,
} from './ApiHelper';

// import constant for urls
// all endpoints is defined in constants/api.js
import { API_ENDPOINTS } from '../../constants/api';
import { CragModel } from './ApiModels';
import InitFirebaseApps from '../firebase/InitFirebaseApps';

/*
 * First create a class inherit from BaseApiPayload if u need to send payload
 * if no payload is needed, u can skip this step and use BaseApiPayload when creating CustomApiRequest
 *
 * The payload for all request mode(GET, POST, etc) will be using the same class
 * I coded the CustomApiRequest to handle the difference internally
 *
 * If no payload is needed, u can skip this step
 */
class GetCragInfoPayload extends BaseApiPayload {
  /**
   * When define the payload, u need to consider what field is needed by the backend API
   * for this example, the backend need a field named crag_id
   *
   * -------------------------------
   *
   * after that add the field to fieldMapping static method which is inherited from BaseApiPayload
   * there will be data which needed to be inherited from parent class
   * so remember to call
   *
   *    ...super.fieldMapping
   *
   * to get the parent class field first
   * then add in the extra field needed
   *
   * -------------------------------
   *
   * for the extra data will be following this format:
   *
   *    field_name_in_class: 'field_name_in_json'
   *
   * so for thse example, the field name:
   *
   *    crag_id: 'crag_id'
   *
   * just make sure both the name is the same to avoid some binding issues
   */
  static get fieldMapping() {
    return {
      ...super.fieldMapping,
      crag_id: 'crag_id',
    };
  }

  /**
   * after that define the constructor
   * there will have data handled by parent class
   * there for the constructor also need to call the parent constructor first
   *
   *    super()
   *
   * then assign the extra values needed
   *    this.crag_id = {input value}
   *
   * ------------------------------
   *
   * BTW JS provided this nice syntax to hint the IDE about the input value type
   * so that if a mismatched value is fed into this method
   * the IDE will complaint
   * But it is not nessary, if u confident can dont do this
   *
   * @param {Object} options this allow this method to read JSON as input
   * @param {string} [options.crag_id] the crag id needed by backend API
   */
  constructor({ crag_id } = {}) {
    super();

    this.crag_id = crag_id;
  }
}

/**
 * After that, create response class which inherit from BaseApiResponse if u need to parse response
 * if no response parsing is needed, u can skip this step and use BaseApiResponse when creating CustomApiRequest
 */
class GetCragInfoResponse extends BaseApiResponse {
  /**
   * Similar to payload, need to define fieldMapping static method
   *
   * first consider the field needed by the backend response
   * for this example, the backend response will have a field named data
   * which contain the crag information
   *
   * dont forget to inherit the parent class field first
   * this is super important for response class
   *
   *    ...super.fieldMapping
   *
   * then add in the extra field needed
   *    data: 'data'
   */
  static get fieldMapping() {
    return {
      ...super.fieldMapping,
      data: 'data',
    };
  }

  /**
   * after that define the constructor
   * there will have data handled by parent class
   * there for the constructor also need to call the parent constructor first
   *
   *    super({ status, success, message, errors });
   *
   * then assign the extra values needed
   *
   *    this.data = {input value}
   *
   * Note that in this example, the data field will contain the crag information which represented in CragModel
   * so the data input value type will be CragModel
   * and also it is always recommended to do a instanceof check before assign the value
   * to avoid unexpected error
   *
   *    if (data instanceof CragModel) {
   *        this.data = data;
   *    } else {
   *        this.data = CragModel.fromJson(data);
   *    }
   *
   * for all the Models is defined in ApiModels.js can refer to that file if needed
   *
   * The Model is coded with class level function which named fromJson() to convert raw JSON object into Model instance
   * can use it to convert the raw JSON into Model instance
   *
   * BTW there will have some situation that the data field will be a array
   * in that case, u can use a loop to convert each raw JSON object into Model instance
   * E.g.,
   *
   *    for (let i = 0; i < data.length; i++) {
   *        const item = data[i];
   *
   *        if (item instanceof PostModel) {
   *            this.data.push(item);
   *        } else {
   *            this.data.push(PostModel.fromJson(item));
   *        }
   *    }
   *
   * or can use lamda for looping also like this
   *
   *    this.data = Array.isArray(data) ? data.map(item =>
   *       item instanceof CragModel ? item : CragModel.fromJson(item)
   *    ) : [];
   *
   *
   * And also the define hint if u want it
   * @param {Object} options this allow this method to read JSON as input
   * @param {boolean} [options.success] this alr defined in base class
   * @param {string} [options.message] this alr defined in base class
   * @param {*} [options.errors] this alr defined in base class
   * @param {CragModel} [options.data] this will be the extra field
   */
  constructor({ status, success, message, errors, data } = {}) {
    super({ status, success, message, errors });
    this.data = data;
  }
}

/**
 * Finally create the service method to call the API
 * this method will create a CustomApiRequest instance and send the request
 * then return the response received
 *
 * -------------------------------
 *
 * Note for all request method, it is recommended to make it async
 * async method will return a Promise
 *
 * Promise is a nice feature in JS to handle the asynchronous operation
 * so that the UI will not be blocked when waiting for the response
 *
 * let promise = getCragInfo('some_crag_id');
 * promise.then(response => {
 *   // handle the response here
 *   console.log('Crag Info:', response.data.name);
 * });
 *
 * this will run the getCragInfo method in another thread
 * when the response is received, the then() method will be triggered and do the handling
 *
 * and also you can use await keyword to wait for the Promise to resolve
 * but remember that await can only be used inside async method and it will block the current thread to wait until the Promise is resolved
 * so use it carefully
 *
 * let result = await getCragInfo('some_crag_id');
 * if (result.success) {
 *   console.log('Crag Info:', result.data.name);
 * }
 *
 */
export default async function getCragInfo(cragId) {
  /**
   * need to make sure Firebase AppCheck is initialized before sending the request
   * because the backend will use AppCheck for authenticating the request
   *
   * if u set attachAppCheckField to true when creating CustomApiRequest object
   * it will try get a token from Firebase AppCheck, if the AppCheck isnt init in this step it will throw a error
   */
  // await InitFirebaseApps();

  /**
   * create a instance of the payload u just coded
   * the data parse in will be crag_id in this case
   *
   * note that data pasre will be a JSON lile dict
   *    {'property_name': {value}}
   */
  let payload = new GetCragInfoPayload({ crag_id: cragId });

  /**
   * create a CustomApiRequest instance
   *
   * the constructor need these parameters:
   * 1. request method (GET, POST, etc) - use RequestMethod enum
   * 2. base url - can get from API_ENDPOINTS.BASE_URL
   * 3. endpoint url - can get from API_ENDPOINTS.<SERVICE>.<ENDPOINT>
   * 4. payload - if no payload is needed, can use BaseApiPayload
   * 5. includeAppCheckHeader - boolean to indicate whether to include App Check header, default is true
   *
   * for is endpoint, request method will be GET
   * endpoint urls is API_ENDPOINTS.CRAG.GET_CRAG_INFO
   *
   * if there is undefined endpoint, can add to API_ENDPOINTS in constants/api.js
   *
   */

  // Set the url and path, u can also pass in direct when constructing CustomApiRequest;
  const baseUrl = API_ENDPOINTS.BASE_URL;
  const endpoint = API_ENDPOINTS.CRAG.GET_CRAG_INFO;

  {
    const req = new CustomApiRequest(
      RequestMethod.GET,
      baseUrl,
      endpoint,
      payload,
    );

    /**
     * send the request after consturcting it
     *
     * for sendRequest will be a async function also, u can decide to await or let it run it background
     *
     * sendRequest will takes in 1 argument which is the response class u created just now
     * if not parse in, it will use BaseApiResponse class by default
     * if using BaseApiResponse, the request will not contain the extra field u defined just now
     * resulting in the extra value isn't parse to a Model, and u will need handle the data manually
     *
     */
    const result = await req.sendRequest(GetCragInfoResponse);

    /**
     * At this step the data will be fetch from backend and what u need to do is use OOP technic to get the data
     *
     * CustomApiResponse will contain functions:
     *    -> sendRequest() - use for sending the request and return a bool, usually u wont use this any more after request is sent
     *    -> logResponse() - use for debugging, this will log the entire response to RN debug console
     *    -> Request - this is return the data fetched by sendRequest() in instance of the class u parse in when calling sendRequest({ur_class})
     *
     * U can either use the Response in CustomApiRequest instance or create a new one
     * highly recommed create a new one to avoid overwrit data accidentally
     *
     * to create a new instance of the response:
     *    let response = new GetCragInfoResponse(req.Response)
     */
    if (result) {
      // create a new instance for response
      const response = new GetCragInfoResponse(req.Response);

      /**
       * after this u can access the field in response
       *
       * response will contain these fields:
       *  -> status - the HTTP status return by backend, eg 200, 201, 401, 404...
       *  -> message - message returned from backend, backend team usually put 'success' is the fetch is success and error message if its failed
       *  -> errors - the errors return by backend, backend team will usually put excption errors here, if the fetch is success this will be null(ideally :D)
       *  -> {extra field} - the data u defined in GetCragResponse class early
       *
       * in this case extra field will be 'data', and it will be a instance of CragModel
       *
       */
      console.log('request: ' + response.status);
      console.log('request: ' + response.message);
      console.log(
        'request: ' + (response.errors ? response.errors : 'no errors'),
      );

      const crag = new CragModel(response.data);

      /**
       * for all the model is defined in services/api/ApiModels.js can refer to that file for model details
       *
       * each model will be representing the table stored in database
       *
       * for CragModel which is used in this example,
       * it contains these field:
       *  -> cragId
       *  -> description
       *  -> imagesUrls - maybe will be removed in future because can use FirebaseStorage helper function to get the image using only cragId
       *  -> locationLat - location data of the crag
       *  -> locationLon - location data of the crag
       */
      console.log('request: ' + crag.cragId);
      console.log('request: ' + crag.name);
      console.log('request: ' + crag.description);
      console.log('request: ' + crag.imageUrls);
      console.log('request: ' + crag.locationLat);
      console.log('request: ' + crag.locationLon);

      console.log('request: \n' + req.logResponse());
    } else {
      // output the raw data if failed
      console.warn('request: \n' + req.logResponse());
    }
  }

  //example for using promise which allow the main theard continue running
  {
    const req = new CustomApiRequest(
      RequestMethod.GET,
      API_ENDPOINTS.BASE_URL,
      API_ENDPOINTS.CRAG.GET_CRAG_INFO,
      payload,
    );

    let promise = req.sendRequest(GetCragInfoResponse);

    promise.then(success => {
      if (success) {
        const response = new GetCragInfoResponse(req.Response);

        console.log('request(promise): ' + response.status);
        console.log('request(promise): ' + response.message);
        console.log(
          'request(promise): ' +
            (response.errors ? response.errors : 'no errors'),
        );

        const crag = new CragModel(response.data);

        console.log('request(promise): ' + crag.cragId);
        console.log('request(promise): ' + crag.name);
        console.log('request(promise): ' + crag.description);
        console.log('request(promise): ' + crag.imageUrls);
        console.log('request(promise): ' + crag.locationLat);
        console.log('request(promise): ' + crag.locationLon);

        console.log('request(promise): \n' + req.logResponse());
      } else {
        console.warn('request(promise): \n' + req.logResponse());
      }
    });
  }
}
