# Thinkify Chrome Extension Icons

This directory should contain the following icon files for the Chrome extension:

## Required Icon Files

- `icon16.png` - 16x16 pixels (toolbar icon)
- `icon48.png` - 48x48 pixels (extensions page)
- `icon128.png` - 128x128 pixels (Chrome Web Store)

## Icon Design Guidelines

### Design Elements
- **Primary Color**: Purple gradient (#667eea to #764ba2)
- **Symbol**: Target/bullseye emoji (🎯) or similar quiz/education icon
- **Background**: Rounded rectangle with gradient
- **Style**: Modern, clean, professional

### Creating the Icons

You can create these icons using:

1. **Design Software**: Figma, Sketch, Canva, or Photoshop
2. **Online Tools**: 
   - [Favicon.io](https://favicon.io)
   - [LogoMakr](https://logomakr.com)
   - [Canva](https://canva.com)

### Recommended Design

```
Background: Linear gradient (#667eea → #764ba2)
Shape: Rounded rectangle (border-radius: 20%)
Icon: White target/quiz symbol (🎯 or custom)
Border: Optional 1px white border for contrast
```

### Sample SVG Template

```svg
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea"/>
      <stop offset="100%" style="stop-color:#764ba2"/>
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="128" height="128" rx="25" fill="url(#bg)"/>
  
  <!-- Target/Quiz Icon -->
  <circle cx="64" cy="64" r="35" fill="none" stroke="white" stroke-width="4"/>
  <circle cx="64" cy="64" r="25" fill="none" stroke="white" stroke-width="3"/>
  <circle cx="64" cy="64" r="15" fill="none" stroke="white" stroke-width="2"/>
  <circle cx="64" cy="64" r="8" fill="white"/>
</svg>
```

### Export Specifications

- **Format**: PNG with transparency
- **Quality**: High resolution, crisp edges
- **Compression**: Optimized for file size
- **Naming**: Exact filenames as listed above

### Quick Creation Steps

1. Create a 128x128px canvas
2. Add purple gradient background
3. Add target/quiz icon in white
4. Export as PNG
5. Resize to create 48x48 and 16x16 versions
6. Save all three files in this directory

The extension will work without these icons, but they improve the user experience and professionalism of the extension. 