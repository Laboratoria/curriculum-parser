import { vi } from 'vitest';

export default vi.fn().mockReturnValue({
  resize: vi.fn().mockReturnValue({
    toBuffer: vi.fn().mockResolvedValue('data:image/png;base64,xxxx'),
  }),
});
