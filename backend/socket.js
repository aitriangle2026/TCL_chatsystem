let io;

const setIo = (socketIo) => {
  io = socketIo;
};

const getIo = () => {
  return io;
};

module.exports = {
  setIo,
  getIo,
};