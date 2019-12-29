const allSettledWithMetadata = promises => {
  let wrappedPromises = promises.map(({ promise, metadata }) =>
    Promise.resolve(promise).then(
      val => ({ status: "fulfilled", value: val, metadata }),
      err => ({ status: "rejected", reason: err, metadata })
    )
  );
  return Promise.all(wrappedPromises);
};
export default allSettledWithMetadata;
