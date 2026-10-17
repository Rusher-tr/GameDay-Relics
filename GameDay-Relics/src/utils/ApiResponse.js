class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.message = message;
    this.data = data;
    this.success = statusCode < 400;
    this.statusCode = statusCode;
  }
}

export { ApiResponse };
