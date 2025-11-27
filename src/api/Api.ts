/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface UserCredentials {
  login: string;
  password: string;
}

export interface TruckDetailParams {
  id: number;
}

export interface TruckUpdateParams {
  id: number;
}

export interface TruckDeleteParams {
  id: number;
}

export interface TrucksImageCreateParams {
  id: number;
}

export interface LogisticsDraftAddCreateParams {
  id: number;
}

export interface LogisticsDetailParams {
  id: number;
}

export interface LogisticsUpdateParams {
  id: number;
}

export interface LogisticsDeleteParams {
  id: number;
}

export interface LogisticsSaveUpdateParams {
  id: number;
}

export interface LogisticsFinalizeUpdateParams {
  id: number;
}

export interface LogisticsCloseUpdateParams {
  id: number;
  status?: string;
}

export interface LogisticTruckUpdateParams {
  logisticId: number;
  truckId: number;
}

export interface LogisticTruckDeleteParams {
  logisticId: number;
  truckId: number;
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
            method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] =
        property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(
          key,
          isFileType ? formItem : this.stringifyFormItem(formItem),
        );
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title WebRIP API
 * @version 1.0.0
 */
export class Api<SecurityDataType extends unknown> {
  http: HttpClient<SecurityDataType>;

  constructor(http: HttpClient<SecurityDataType>) {
    this.http = http;
  }

  users = {
    /**
     * No description
     *
     * @tags Users
     * @name UsersRegisterCreate
     * @summary Register
     * @request POST:/api/users/register
     * @response `201` `void` created
     * @response `400` `void` bad request
     */
    usersRegisterCreate: (data: UserCredentials, params: RequestParams = {}) =>
      this.http.request<void, void>({
        path: `/api/users/register`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UsersLoginCreate
     * @summary Login
     * @request POST:/api/users/login
     * @response `200` `void` ok
     * @response `400` `void` bad request
     * @response `401` `void` unauthorized
     */
    usersLoginCreate: (data: UserCredentials, params: RequestParams = {}) =>
      this.http.request<void, void>({
        path: `/api/users/login`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UsersLogoutCreate
     * @summary Logout
     * @request POST:/api/users/logout
     * @response `200` `void` ok
     */
    usersLogoutCreate: (params: RequestParams = {}) =>
      this.http.request<void, any>({
        path: `/api/users/logout`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UsersMeList
     * @summary Me
     * @request GET:/api/users/me
     * @secure
     * @response `200` `void` ok
     * @response `401` `void` unauthorized
     */
    usersMeList: (params: RequestParams = {}) =>
      this.http.request<void, void>({
        path: `/api/users/me`,
        method: "GET",
        secure: true,
        ...params,
      }),
  };
  trucks = {
    /**
     * No description
     *
     * @tags Trucks
     * @name TrucksList
     * @summary List trucks (public)
     * @request GET:/api/trucks
     * @response `200` `void` ok
     */
    trucksList: (params: RequestParams = {}) =>
      this.http.request<void, any>({
        path: `/api/trucks`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Trucks
     * @name TrucksImageCreate
     * @summary Upload truck image (moderator)
     * @request POST:/api/trucks/{id}/image
     * @secure
     * @response `200` `void` ok
     * @response `403` `void` forbidden
     */
    trucksImageCreate: (
      { id, ...query }: TrucksImageCreateParams,
      params: RequestParams = {},
    ) =>
      this.http.request<void, void>({
        path: `/api/trucks/${id}/image`,
        method: "POST",
        secure: true,
        ...params,
      }),
  };
  truck = {
    /**
     * No description
     *
     * @tags Trucks
     * @name TruckCreate
     * @summary Create truck (moderator)
     * @request POST:/api/truck
     * @secure
     * @response `201` `void` created
     * @response `403` `void` forbidden
     */
    truckCreate: (params: RequestParams = {}) =>
      this.http.request<void, void>({
        path: `/api/truck`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Trucks
     * @name TruckDetail
     * @summary Get truck by id (public)
     * @request GET:/api/truck/{id}
     * @response `200` `void` ok
     */
    truckDetail: (
      { id, ...query }: TruckDetailParams,
      params: RequestParams = {},
    ) =>
      this.http.request<void, any>({
        path: `/api/truck/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Trucks
     * @name TruckUpdate
     * @summary Update truck (moderator)
     * @request PUT:/api/truck/{id}
     * @secure
     * @response `200` `void` ok
     * @response `403` `void` forbidden
     */
    truckUpdate: (
      { id, ...query }: TruckUpdateParams,
      params: RequestParams = {},
    ) =>
      this.http.request<void, void>({
        path: `/api/truck/${id}`,
        method: "PUT",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Trucks
     * @name TruckDelete
     * @summary Delete truck (moderator)
     * @request DELETE:/api/truck/{id}
     * @secure
     * @response `200` `void` ok
     * @response `403` `void` forbidden
     */
    truckDelete: (
      { id, ...query }: TruckDeleteParams,
      params: RequestParams = {},
    ) =>
      this.http.request<void, void>({
        path: `/api/truck/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),
  };
  logistic = {
    /**
     * No description
     *
     * @tags Logistics
     * @name LogisticDraftList
     * @summary Get current user's draft
     * @request GET:/api/logistic/draft
     * @secure
     * @response `200` `void` ok
     * @response `401` `void` unauthorized
     */
    logisticDraftList: (params: RequestParams = {}) =>
      this.http.request<void, void>({
        path: `/api/logistic/draft`,
        method: "GET",
        secure: true,
        ...params,
      }),
  };
  logistics = {
    /**
     * No description
     *
     * @tags Logistics
     * @name LogisticsDraftAddCreate
     * @summary Add truck to draft (user)
     * @request POST:/api/logistics/draft/add/{id}
     * @secure
     * @response `200` `void` ok
     * @response `401` `void` unauthorized
     */
    logisticsDraftAddCreate: (
      { id, ...query }: LogisticsDraftAddCreateParams,
      params: RequestParams = {},
    ) =>
      this.http.request<void, void>({
        path: `/api/logistics/draft/add/${id}`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Logistics
     * @name LogisticsList
     * @summary List logistics (auth: creator only; moderator all)
     * @request GET:/api/logistics
     * @secure
     * @response `200` `void` ok
     * @response `401` `void` unauthorized
     */
    logisticsList: (params: RequestParams = {}) =>
      this.http.request<void, void>({
        path: `/api/logistics`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Logistics
     * @name LogisticsDetail
     * @summary Get logistic by id (auth)
     * @request GET:/api/logistics/{id}
     * @secure
     * @response `200` `void` ok
     * @response `401` `void` unauthorized
     */
    logisticsDetail: (
      { id, ...query }: LogisticsDetailParams,
      params: RequestParams = {},
    ) =>
      this.http.request<void, void>({
        path: `/api/logistics/${id}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Logistics
     * @name LogisticsUpdate
     * @summary Update logistic (moderator)
     * @request PUT:/api/logistics/{id}
     * @secure
     * @response `200` `void` ok
     * @response `403` `void` forbidden
     */
    logisticsUpdate: (
      { id, ...query }: LogisticsUpdateParams,
      params: RequestParams = {},
    ) =>
      this.http.request<void, void>({
        path: `/api/logistics/${id}`,
        method: "PUT",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Logistics
     * @name LogisticsDelete
     * @summary Soft delete logistic (moderator)
     * @request DELETE:/api/logistics/{id}
     * @secure
     * @response `200` `void` ok
     * @response `403` `void` forbidden
     */
    logisticsDelete: (
      { id, ...query }: LogisticsDeleteParams,
      params: RequestParams = {},
    ) =>
      this.http.request<void, void>({
        path: `/api/logistics/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Logistics
     * @name LogisticsSaveUpdate
     * @summary Save logistic (user: change status to 'сформирован')
     * @request PUT:/api/logistics/{id}/save
     * @secure
     * @response `200` `void` ok
     * @response `401` `void` unauthorized
     * @response `403` `void` forbidden
     */
    logisticsSaveUpdate: (
      { id, ...query }: LogisticsSaveUpdateParams,
      params: RequestParams = {},
    ) =>
      this.http.request<void, void>({
        path: `/api/logistics/${id}/save`,
        method: "PUT",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Logistics
     * @name LogisticsFinalizeUpdate
     * @summary Finalize/complete (moderator)
     * @request PUT:/api/logistics/{id}/finalize
     * @secure
     * @response `200` `void` ok
     * @response `403` `void` forbidden
     */
    logisticsFinalizeUpdate: (
      { id, ...query }: LogisticsFinalizeUpdateParams,
      params: RequestParams = {},
    ) =>
      this.http.request<void, void>({
        path: `/api/logistics/${id}/finalize`,
        method: "PUT",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Logistics
     * @name LogisticsCloseUpdate
     * @summary Close/Reject (moderator)
     * @request PUT:/api/logistics/{id}/close
     * @secure
     * @response `200` `void` ok
     * @response `403` `void` forbidden
     */
    logisticsCloseUpdate: (
      { id, ...query }: LogisticsCloseUpdateParams,
      params: RequestParams = {},
    ) =>
      this.http.request<void, void>({
        path: `/api/logistics/${id}/close`,
        method: "PUT",
        secure: true,
        query: query as any,
        ...params,
      }),
  };
  logisticTruck = {
    /**
     * No description
     *
     * @tags Logistic-Trucks
     * @name LogisticTruckUpdate
     * @summary Update logistic-truck (moderator)
     * @request PUT:/api/logistic-truck/{logistic_id}/{truck_id}
     * @secure
     * @response `200` `void` ok
     * @response `403` `void` forbidden
     */
    logisticTruckUpdate: (
      { logisticId, truckId, ...query }: LogisticTruckUpdateParams,
      params: RequestParams = {},
    ) =>
      this.http.request<void, void>({
        path: `/api/logistic-truck/${logisticId}/${truckId}`,
        method: "PUT",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Logistic-Trucks
     * @name LogisticTruckDelete
     * @summary Delete logistic-truck (moderator)
     * @request DELETE:/api/logistic-truck/{logistic_id}/{truck_id}
     * @secure
     * @response `200` `void` ok
     * @response `403` `void` forbidden
     */
    logisticTruckDelete: (
      { logisticId, truckId, ...query }: LogisticTruckDeleteParams,
      params: RequestParams = {},
    ) =>
      this.http.request<void, void>({
        path: `/api/logistic-truck/${logisticId}/${truckId}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),
  };
}
