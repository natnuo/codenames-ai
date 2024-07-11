export type Word = string;

export const isWord = (s: string): boolean => {
  return s.split(" ").length === 1;
};

export const processWordListParam = (s: string): Word[] => {
  return s.split(",").map((s) => {
    return s.trim().replace(" ", "-");
  }).filter((s) => {
    return s !== "";
  });
};

export interface Clue {
  word: Word,
  quantity: number,
};

export interface AnsweredClue extends Clue {
  intended: Word[],
};

export enum HTTPStatus {
  CONTINUE = 100,
  PROCESSING = 102,
  OK = 200, 
  CREATED = 201,
  ACCEPTED = 202,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,  // client identity unknown
  FORBIDDEN = 404,  // client identity known, but client is not permitted to access the data... we will send 404 for forbidden, not 403, to hide the existence of certain resources
  NOT_FOUND = 404,
  PAYLOAD_TOO_LARGE = 413,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,  // i think that bad gateway would include invalid ai repsonses
  SERVICE_UNAVAILABLE = 503,
};

export type ErrorID = string;

export interface ERROR {
  id: ErrorID,
  status: HTTPStatus,
  description: string,
  ine: boolean,
};

export const error = (id: string, status: HTTPStatus, description: string): ERROR => {
  return <ERROR>{
    id: Date.now() + id,
    status: status,
    description: description,
    ine: false,
  };
};

export const mutateError = (originalError: ERROR, extraID: ErrorID) => {
  return <ERROR>{
    id: originalError.id + ":" + extraID,
    status: originalError.status,
    description: originalError.description,
    ine: false,
  };
};

export const isError = (obj: any): obj is ERROR => {
  return obj && "ine" in obj;
};

