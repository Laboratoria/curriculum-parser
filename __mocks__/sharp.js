module.exports = jest.fn().mockReturnValue({
  resize: jest.fn().mockReturnValue({
    toBuffer: jest.fn().mockResolvedValue('data:image/png;base64,xxxx'),
  }),
});
