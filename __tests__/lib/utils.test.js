import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility', () => {
  it('should merge class names', () => {
    const result = cn('foo', 'bar');
    expect(result).toContain('foo');
    expect(result).toContain('bar');
  });

  it('should handle conditional classes', () => {
    const result = cn('base', false && 'hidden', 'visible');
    expect(result).toContain('base');
    expect(result).toContain('visible');
    expect(result).not.toContain('hidden');
  });

  it('should handle undefined and null gracefully', () => {
    const result = cn('base', undefined, null, 'end');
    expect(result).toContain('base');
    expect(result).toContain('end');
  });

  it('should handle empty call', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should merge tailwind classes (last wins)', () => {
    // tailwind-merge ensures only the last conflicting utility is kept
    const result = cn('p-4', 'p-8');
    expect(result).toContain('p-8');
    expect(result).not.toContain('p-4');
  });
});
