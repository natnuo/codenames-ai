"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isError = exports.mutateError = exports.error = exports.HTTPStatus = exports.processWordListParam = exports.isWord = void 0;
const isWord = (s) => {
    return s.split(" ").length === 1;
};
exports.isWord = isWord;
const processWordListParam = (s) => {
    return s.split(",").map((s) => {
        return s.trim().replace(" ", "-");
    }).filter((s) => {
        return s !== "";
    });
};
exports.processWordListParam = processWordListParam;
;
;
var HTTPStatus;
(function (HTTPStatus) {
    HTTPStatus[HTTPStatus["CONTINUE"] = 100] = "CONTINUE";
    HTTPStatus[HTTPStatus["PROCESSING"] = 102] = "PROCESSING";
    HTTPStatus[HTTPStatus["OK"] = 200] = "OK";
    HTTPStatus[HTTPStatus["CREATED"] = 201] = "CREATED";
    HTTPStatus[HTTPStatus["ACCEPTED"] = 202] = "ACCEPTED";
    HTTPStatus[HTTPStatus["BAD_REQUEST"] = 400] = "BAD_REQUEST";
    HTTPStatus[HTTPStatus["UNAUTHORIZED"] = 401] = "UNAUTHORIZED";
    HTTPStatus[HTTPStatus["FORBIDDEN"] = 404] = "FORBIDDEN";
    HTTPStatus[HTTPStatus["NOT_FOUND"] = 404] = "NOT_FOUND";
    HTTPStatus[HTTPStatus["PAYLOAD_TOO_LARGE"] = 413] = "PAYLOAD_TOO_LARGE";
    HTTPStatus[HTTPStatus["TOO_MANY_REQUESTS"] = 429] = "TOO_MANY_REQUESTS";
    HTTPStatus[HTTPStatus["INTERNAL_SERVER_ERROR"] = 500] = "INTERNAL_SERVER_ERROR";
    HTTPStatus[HTTPStatus["BAD_GATEWAY"] = 502] = "BAD_GATEWAY";
    HTTPStatus[HTTPStatus["SERVICE_UNAVAILABLE"] = 503] = "SERVICE_UNAVAILABLE";
})(HTTPStatus || (exports.HTTPStatus = HTTPStatus = {}));
;
;
const error = (id, status, description) => {
    return {
        id: Date.now() + id,
        status: status,
        description: description,
        ine: false,
    };
};
exports.error = error;
const mutateError = (originalError, extraID) => {
    return {
        id: originalError.id + ":" + extraID,
        status: originalError.status,
        description: originalError.description,
        ine: false,
    };
};
exports.mutateError = mutateError;
const isError = (obj) => {
    return obj && "ine" in obj;
};
exports.isError = isError;
