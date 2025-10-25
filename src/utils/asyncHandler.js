// what we are trying to do here is to create a function that takes a function as input
//  and returns a function that handles async errors
// this is useful in DB operations where we have to deal with promises
// so instead of writing try catch block in every function we can use this asyncHandler

// return caused first error
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};
export { asyncHandler };
