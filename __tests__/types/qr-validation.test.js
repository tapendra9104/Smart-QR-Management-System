import { describe, it, expect } from 'vitest';
import {
  DEFAULT_QR_STYLE,
  COLOR_PRESETS,
  DOT_STYLES,
  FRAME_STYLES,
  DOWNLOAD_SIZES,
  LOGO_GALLERY,
} from '@/lib/types/qr';

// ─── DEFAULT_QR_STYLE ─────────────────────────────────────────────────────────

describe('DEFAULT_QR_STYLE', () => {
  it('has a black foreground color', () => {
    expect(DEFAULT_QR_STYLE.fgColor).toBe('#000000');
  });

  it('has a white background color', () => {
    expect(DEFAULT_QR_STYLE.bgColor).toBe('#ffffff');
  });

  it('has a size of 256px', () => {
    expect(DEFAULT_QR_STYLE.size).toBe(256);
  });

  it('has quiet zone of 16', () => {
    expect(DEFAULT_QR_STYLE.quietZone).toBe(16);
  });

  it('uses M error correction level by default', () => {
    expect(DEFAULT_QR_STYLE.ecLevel).toBe('M');
  });

  it('uses squares dot style by default', () => {
    expect(DEFAULT_QR_STYLE.qrStyle).toBe('squares');
  });

  it('has no frame by default', () => {
    expect(DEFAULT_QR_STYLE.frameStyle).toBe('none');
  });

  it('disables linear gradient by default', () => {
    expect(DEFAULT_QR_STYLE.enableLinearGradient).toBe(false);
  });

  it('has logo opacity of 1 (fully opaque)', () => {
    expect(DEFAULT_QR_STYLE.logoOpacity).toBe(1);
  });

  it('removes QR code behind logo by default', () => {
    expect(DEFAULT_QR_STYLE.removeQrCodeBehindLogo).toBe(true);
  });

  it('has all required style fields', () => {
    const requiredFields = [
      'fgColor', 'bgColor', 'size', 'quietZone', 'ecLevel',
      'qrStyle', 'eyeRadius', 'logoWidth', 'logoHeight',
      'logoOpacity', 'removeQrCodeBehindLogo', 'frameStyle', 'frameText',
    ];
    requiredFields.forEach((field) => {
      expect(DEFAULT_QR_STYLE).toHaveProperty(field);
    });
  });
});

// ─── COLOR_PRESETS ────────────────────────────────────────────────────────────

describe('COLOR_PRESETS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(COLOR_PRESETS)).toBe(true);
    expect(COLOR_PRESETS.length).toBeGreaterThan(0);
  });

  it('every preset has name, fg, and bg fields', () => {
    COLOR_PRESETS.forEach((preset) => {
      expect(preset).toHaveProperty('name');
      expect(preset).toHaveProperty('fg');
      expect(preset).toHaveProperty('bg');
    });
  });

  it('every fg and bg is a valid hex color', () => {
    const hexPattern = /^#[0-9a-fA-F]{6}$/;
    COLOR_PRESETS.forEach(({ name, fg, bg }) => {
      expect(fg, `${name}: fg should be hex`).toMatch(hexPattern);
      expect(bg, `${name}: bg should be hex`).toMatch(hexPattern);
    });
  });

  it('includes a Classic preset with black/white', () => {
    const classic = COLOR_PRESETS.find((p) => p.name === 'Classic');
    expect(classic).toBeDefined();
    expect(classic.fg).toBe('#000000');
    expect(classic.bg).toBe('#ffffff');
  });

  it('has no duplicate names', () => {
    const names = COLOR_PRESETS.map((p) => p.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });
});

// ─── DOT_STYLES ───────────────────────────────────────────────────────────────

describe('DOT_STYLES', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(DOT_STYLES)).toBe(true);
    expect(DOT_STYLES.length).toBeGreaterThan(0);
  });

  it('every dot style has value and label', () => {
    DOT_STYLES.forEach((style) => {
      expect(style).toHaveProperty('value');
      expect(style).toHaveProperty('label');
    });
  });

  it('includes squares style', () => {
    expect(DOT_STYLES.some((s) => s.value === 'squares')).toBe(true);
  });

  it('includes dots style', () => {
    expect(DOT_STYLES.some((s) => s.value === 'dots')).toBe(true);
  });
});

// ─── FRAME_STYLES ─────────────────────────────────────────────────────────────

describe('FRAME_STYLES', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(FRAME_STYLES)).toBe(true);
    expect(FRAME_STYLES.length).toBeGreaterThan(0);
  });

  it('every frame style has value and label', () => {
    FRAME_STYLES.forEach((style) => {
      expect(style).toHaveProperty('value');
      expect(style).toHaveProperty('label');
    });
  });

  it('includes a "none" option as the first entry', () => {
    expect(FRAME_STYLES[0].value).toBe('none');
  });

  it('has no duplicate values', () => {
    const values = FRAME_STYLES.map((s) => s.value);
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(values.length);
  });
});

// ─── DOWNLOAD_SIZES ───────────────────────────────────────────────────────────

describe('DOWNLOAD_SIZES', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(DOWNLOAD_SIZES)).toBe(true);
    expect(DOWNLOAD_SIZES.length).toBeGreaterThan(0);
  });

  it('every size has a numeric value and a string label', () => {
    DOWNLOAD_SIZES.forEach(({ value, label }) => {
      expect(typeof value).toBe('number');
      expect(typeof label).toBe('string');
    });
  });

  it('sizes are in ascending order', () => {
    for (let i = 1; i < DOWNLOAD_SIZES.length; i++) {
      expect(DOWNLOAD_SIZES[i].value).toBeGreaterThan(DOWNLOAD_SIZES[i - 1].value);
    }
  });

  it('includes a 1000px option', () => {
    expect(DOWNLOAD_SIZES.some((s) => s.value === 1000)).toBe(true);
  });
});

// ─── LOGO_GALLERY ─────────────────────────────────────────────────────────────

describe('LOGO_GALLERY', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(LOGO_GALLERY)).toBe(true);
    expect(LOGO_GALLERY.length).toBeGreaterThan(0);
  });

  it('every logo has name, url, and category fields', () => {
    LOGO_GALLERY.forEach((logo) => {
      expect(logo).toHaveProperty('name');
      expect(logo).toHaveProperty('url');
      expect(logo).toHaveProperty('category');
    });
  });

  it('all logo URLs are valid HTTPS URLs', () => {
    LOGO_GALLERY.forEach(({ name, url }) => {
      expect(url, `${name} should have an https URL`).toMatch(/^https:\/\//);
    });
  });

  it('all categories are known values', () => {
    const knownCategories = new Set(['Social', 'Tech', 'Media', 'Finance', 'Utility']);
    LOGO_GALLERY.forEach(({ name, category }) => {
      expect(knownCategories.has(category), `${name} has unknown category: ${category}`).toBe(true);
    });
  });

  it('includes GitHub in the Tech category', () => {
    const github = LOGO_GALLERY.find((l) => l.name === 'GitHub');
    expect(github).toBeDefined();
    expect(github.category).toBe('Tech');
  });
});
