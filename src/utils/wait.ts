const wait = async function (timeInMs: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, timeInMs);
  });
};

export default wait;
