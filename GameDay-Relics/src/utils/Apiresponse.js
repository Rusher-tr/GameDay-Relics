class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.message = message;
    this.data = data;
    this.success = statusCode < 400;
    // status codes less than 400 are considered successful
    this.statusCode = statusCode;
  }
}

export { ApiResponse };
