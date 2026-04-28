import { describe, it, expect } from 'vitest';
import {
  DEFAULT_QR_STYLE,
  COLOR_PRESETS,
  DOT_STYLES,
  FRAME_STYLES,
  LOGO_GALLERY,
  DOWNLOAD_SIZES,
} from '@/lib/types/qr';

describe('QR Type Definitions', () => {
  describe('DEFAULT_QR_STYLE', () => {
    it('should have all required style properties', () => {
      expect(DEFAULT_QR_STYLE).toBeDefined();
      expect(DEFAULT_QR_STYLE.fgColor).toBe('#000000');
      expect(DEFAULT_QR_STYLE.bgColor).toBe('#ffffff');
      expect(DEFAULT_QR_STYLE.size).toBe(256);
      expect(DEFAULT_QR_STYLE.ecLevel).toBe('M');
      expect(DEFAULT_QR_STYLE.qrStyle).toBe('squares');
    });

    it('should have valid logo defaults', () => {
      expect(DEFAULT_QR_STYLE.logoWidth).toBe(60);
      expect(DEFAULT_QR_STYLE.logoHeight).toBe(60);
      expect(DEFAULT_QR_STYLE.logoOpacity).toBe(1);
      expect(DEFAULT_QR_STYLE.removeQrCodeBehindLogo).toBe(true);
    });

    it('should have valid frame defaults', () => {
      expect(DEFAULT_QR_STYLE.frameStyle).toBe('none');
      expect(DEFAULT_QR_STYLE.frameText).toBe('SCAN ME');
      expect(DEFAULT_QR_STYLE.frameColor).toBe('#000000');
      expect(DEFAULT_QR_STYLE.frameTextColor).toBe('#ffffff');
    });

    it('should have gradient disabled by default', () => {
      expect(DEFAULT_QR_STYLE.enableLinearGradient).toBe(false);
      expect(DEFAULT_QR_STYLE.linearGradient).toHaveLength(2);
    });
  });

  describe('COLOR_PRESETS', () => {
    it('should have at least 5 presets', () => {
      expect(COLOR_PRESETS.length).toBeGreaterThanOrEqual(5);
    });

    it('each preset should have name, fg, and bg', () => {
      COLOR_PRESETS.forEach((preset) => {
        expect(preset).toHaveProperty('name');
        expect(preset).toHaveProperty('fg');
        expect(preset).toHaveProperty('bg');
        expect(preset.fg).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(preset.bg).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it('should include a Classic preset', () => {
      const classic = COLOR_PRESETS.find((p) => p.name === 'Classic');
      expect(classic).toBeDefined();
      expect(classic.fg).toBe('#000000');
      expect(classic.bg).toBe('#ffffff');
    });
  });

  describe('DOT_STYLES', () => {
    it('should include squares, dots, and fluid', () => {
      const values = DOT_STYLES.map((s) => s.value);
      expect(values).toContain('squares');
      expect(values).toContain('dots');
      expect(values).toContain('fluid');
    });

    it('each style should have value and label', () => {
      DOT_STYLES.forEach((style) => {
        expect(style).toHaveProperty('value');
        expect(style).toHaveProperty('label');
      });
    });
  });

  describe('FRAME_STYLES', () => {
    it('should include a no-frame option', () => {
      const none = FRAME_STYLES.find((f) => f.value === 'none');
      expect(none).toBeDefined();
      expect(none.label).toBe('No Frame');
    });

    it('should have at least 10 frame options', () => {
      expect(FRAME_STYLES.length).toBeGreaterThanOrEqual(10);
    });

    it('each frame style should have value and label', () => {
      FRAME_STYLES.forEach((frame) => {
        expect(frame).toHaveProperty('value');
        expect(frame).toHaveProperty('label');
        expect(frame.value).toBeTruthy();
        expect(frame.label).toBeTruthy();
      });
    });
  });

  describe('LOGO_GALLERY', () => {
    it('should have at least 20 logos', () => {
      expect(LOGO_GALLERY.length).toBeGreaterThanOrEqual(20);
    });

    it('each logo should have name, url, and category', () => {
      LOGO_GALLERY.forEach((logo) => {
        expect(logo).toHaveProperty('name');
        expect(logo).toHaveProperty('url');
        expect(logo).toHaveProperty('category');
        expect(logo.url).toMatch(/^https:\/\//);
      });
    });

    it('should include Social, Tech, and Utility categories', () => {
      const categories = [...new Set(LOGO_GALLERY.map((l) => l.category))];
      expect(categories).toContain('Social');
      expect(categories).toContain('Tech');
      expect(categories).toContain('Utility');
    });
  });

  describe('DOWNLOAD_SIZES', () => {
    it('should have multiple size options', () => {
      expect(DOWNLOAD_SIZES.length).toBeGreaterThanOrEqual(3);
    });

    it('sizes should be in ascending order', () => {
      for (let i = 1; i < DOWNLOAD_SIZES.length; i++) {
        expect(DOWNLOAD_SIZES[i].value).toBeGreaterThan(DOWNLOAD_SIZES[i - 1].value);
      }
    });

    it('each size should have value and label', () => {
      DOWNLOAD_SIZES.forEach((size) => {
        expect(size).toHaveProperty('value');
        expect(size).toHaveProperty('label');
        expect(typeof size.value).toBe('number');
        expect(size.label).toContain('px');
      });
    });
  });
});
