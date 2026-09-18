import { describe, it, expect, afterEach } from 'vitest';
import { hostPin, omgevingsFouten, omgevingsWaarschuwingen, VOORBEELD_PIN } from '../src/lib/server/omgeving';

const oud = { ...process.env };

afterEach(() => {
  process.env = { ...oud };
});

describe('omgevingsFouten', () => {
  it('laat een laptop met rust', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.HOST_PIN;
    expect(omgevingsFouten()).toEqual([]);
    expect(hostPin()).toBe(VOORBEELD_PIN);
  });

  it('weigert productie zonder pincode', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.HOST_PIN;
    expect(omgevingsFouten()).toHaveLength(1);
  });

  it('weigert de voorbeeldcode uit de README', () => {
    process.env.NODE_ENV = 'production';
    process.env.HOST_PIN = VOORBEELD_PIN;
    expect(omgevingsFouten()).toHaveLength(1);
  });

  it('is tevreden met een eigen code', () => {
    process.env.NODE_ENV = 'production';
    process.env.HOST_PIN = '8391';
    expect(omgevingsFouten()).toEqual([]);
    expect(hostPin()).toBe('8391');
  });
});

describe('omgevingsWaarschuwingen', () => {
  it('mist ORIGIN in productie, maar houdt de avond niet tegen', () => {
    process.env.NODE_ENV = 'production';
    process.env.HOST_PIN = '8391';
    delete process.env.ORIGIN;
    expect(omgevingsWaarschuwingen()).toHaveLength(1);
    expect(omgevingsFouten()).toEqual([]);
  });

  it('zwijgt als ORIGIN er staat', () => {
    process.env.NODE_ENV = 'production';
    process.env.ORIGIN = 'https://kwis.example.nl';
    expect(omgevingsWaarschuwingen()).toEqual([]);
  });
});
