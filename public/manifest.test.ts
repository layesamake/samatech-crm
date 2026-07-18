import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function getPngDimensions(buffer: Buffer) {
  if (buffer.toString('hex', 0, 8) !== '89504e470d0a1a0a') {
    throw new Error('Signature invalide: Not a valid PNG file');
  }
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return { width, height };
}

describe('PWA Manifest', () => {
  it('should have a valid manifest.json with exact required properties', () => {
    const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
    const manifestExists = fs.existsSync(manifestPath);
    expect(manifestExists).toBe(true);

    const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Vérifier les attributs de base
    expect(manifestContent.name).toBe('SAMTECH CRM');
    expect(manifestContent.short_name).toBeDefined();
    expect(manifestContent.start_url).toBe('/');
    expect(manifestContent.scope).toBe('/');
    expect(manifestContent.display).toBe('standalone');
    expect(manifestContent.theme_color).toBeDefined();
    expect(manifestContent.background_color).toBeDefined();
    
    // Vérifier que les icônes référencées existent
    expect(manifestContent.icons).toBeDefined();
    expect(manifestContent.icons.length).toBeGreaterThan(0);
    
    let has192Png = false;
    let has512Png = false;
    
    manifestContent.icons.forEach((icon: { src: string, sizes: string, type: string }) => {
      const iconSrcPath = icon.src.startsWith('/') ? icon.src.substring(1) : icon.src;
      const iconPath = path.join(process.cwd(), 'public', iconSrcPath);
      
      const iconExists = fs.existsSync(iconPath);
      expect(iconExists).toBe(true);
      
      if (icon.type === 'image/png') {
        const buffer = fs.readFileSync(iconPath);
        const { width, height } = getPngDimensions(buffer);
        
        if (icon.sizes === '192x192') {
          has192Png = true;
          expect(width).toBe(192);
          expect(height).toBe(192);
        } else if (icon.sizes === '512x512') {
          has512Png = true;
          expect(width).toBe(512);
          expect(height).toBe(512);
        }
      }
    });

    expect(has192Png).toBe(true);
    expect(has512Png).toBe(true);
  });
});
