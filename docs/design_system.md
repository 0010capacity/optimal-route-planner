# Design System - Optimal Route Planner

## Overview
This document defines the design system for the Optimal Route Planner application, focusing on responsive design principles that provide excellent user experience across mobile, tablet, and desktop devices.

## Design Philosophy

### Core Principles
1. **Mobile-First Approach**: Start with mobile design and progressively enhance for larger screens
2. **Content Priority**: Essential functions always visible, secondary features contextually available
3. **Spatial Efficiency**: Maximize screen real estate usage on larger devices while maintaining usability
4. **Consistent Experience**: Core features work identically across all devices
5. **Performance**: Fast, responsive interactions regardless of device

### User Experience Goals
- **Accessibility**: Touch-friendly on mobile, mouse-optimized on desktop
- **Clarity**: Clear visual hierarchy and information architecture
- **Efficiency**: Minimize clicks/taps to complete common tasks
- **Feedback**: Immediate visual feedback for all user actions

## Responsive Breakpoints

### Breakpoint Definitions
```css
Mobile:    0px - 768px   (Portrait phones, small tablets)
Tablet:    769px - 1024px (Landscape tablets, small laptops)
Desktop:   1025px - 1440px (Laptops, desktops)
Large:     1441px+        (Large monitors, 4K displays)
```

### Usage Strategy
- **Mobile (≤768px)**: Single column, vertical scroll, stacked layout
- **Tablet (769-1024px)**: Two-column layout, side-by-side panels
- **Desktop (≥1025px)**: Three-column layout, full spatial utilization
- **Large (≥1441px)**: Three-column with expanded content areas

## Layout System

### Mobile Layout (≤768px)
```
┌─────────────────┐
│  Location List  │ (Full width, scrollable)
│  or Search      │
├─────────────────┤
│   Map Section   │ (Fixed height: 50vh)
│                 │
└─────────────────┘
│     Footer      │
└─────────────────┘
```
- **Characteristics**:
  - Single column layout
  - Modal-style search (full screen overlay)
  - Touch-optimized controls (min 44px touch targets)
  - Bottom navigation for primary actions

### Tablet Layout (769-1024px)
```
┌───────────────┬─────────────────┐
│ Location List │   Map Section   │
│  or Search    │                 │
│               │                 │
│  (40% width)  │   (60% width)   │
│               │                 │
│               │                 │
└───────────────┴─────────────────┘
│          Footer                 │
└─────────────────────────────────┘
```
- **Characteristics**:
  - Two-column layout
  - Side panel for lists/search
  - Larger map area
  - Persistent controls

### Desktop Layout (≥1025px)
```
┌─────────────┬─────────────────┬─────────────┐
│   Sidebar   │   Map Section   │ Info Panel  │
│ (Location   │                 │  (Route     │
│  List +     │                 │  Summary +  │
│  Controls)  │                 │  Details)   │
│             │                 │             │
│ (25% width) │   (50% width)   │ (25% width) │
└─────────────┴─────────────────┴─────────────┘
│              Footer                         │
└─────────────────────────────────────────────┘
```
- **Characteristics**:
  - Three-column layout
  - Left sidebar: Location management
  - Center: Map visualization
  - Right panel: Route information
  - All panels scrollable independently

### Large Desktop Layout (≥1441px)
- Same structure as Desktop
- Increased padding and spacing
- Larger font sizes for readability
- Max-width constraints for optimal reading length

## Color System

### Primary Colors
```css
--primary-color: #667eea       /* Main brand color */
--primary-hover: #5a6fd8       /* Hover state */
--primary-light: #8b9ef8       /* Light variant */
--primary-dark: #4c5fc7        /* Dark variant */
```

### Semantic Colors
```css
--success-color: #4caf50       /* Success states */
--success-hover: #45a049
--danger-color: #dc3545        /* Error/delete actions */
--danger-hover: #c82333
--warning-color: #ffd700       /* Warning states */
--warning-hover: #ffcc00
--info-color: #17a2b8          /* Informational */
--info-hover: #138496
```

### Neutral Colors
```css
--text-primary: #424242        /* Main text */
--text-secondary: #6c757d      /* Secondary text */
--text-muted: #adb5bd          /* Muted/disabled text */
--bg-primary: #ffffff          /* Primary background */
--bg-secondary: #f8f9fa        /* Secondary background */
--bg-hover: #f1f3f4            /* Hover backgrounds */
--border-color: #e9ecef        /* Default borders */
--border-hover: #dee2e6        /* Hover borders */
```

### Map-Specific Colors
```css
--location-start: #4caf50      /* Start point marker */
--location-waypoint: #667eea   /* Waypoint markers */
--location-end: #dc3545        /* End point marker */
--route-line: #667eea          /* Route polyline */
```

## Typography

### Font Families
```css
--font-primary: 'Roboto', 'Helvetica', 'Arial', sans-serif
--font-mono: 'Courier New', monospace
```

### Font Sizes
```css
/* Mobile */
--font-size-xs: 11px
--font-size-small: 12px
--font-size-medium: 14px
--font-size-large: 16px
--font-size-xlarge: 18px
--font-size-xxlarge: 20px
--font-size-title: 24px

/* Tablet (scale up 10%) */
--font-size-xs-tablet: 12px
--font-size-small-tablet: 13px
--font-size-medium-tablet: 15px
--font-size-large-tablet: 17px

/* Desktop (scale up 20%) */
--font-size-xs-desktop: 13px
--font-size-small-desktop: 14px
--font-size-medium-desktop: 16px
--font-size-large-desktop: 18px
```

### Font Weights
```css
--font-weight-light: 300
--font-weight-regular: 400
--font-weight-medium: 500
--font-weight-bold: 700
```

## Spacing System

### Base Spacing Units
```css
--spacing-xs: 4px
--spacing-small: 8px
--spacing-medium: 12px
--spacing-large: 16px
--spacing-xlarge: 20px
--spacing-xxlarge: 24px
--spacing-xxxlarge: 32px
```

### Component Spacing
- **Mobile**: Compact spacing (small/medium)
- **Tablet**: Medium spacing (medium/large)
- **Desktop**: Comfortable spacing (large/xlarge)

### Grid Gaps
```css
--gap-mobile: 8px
--gap-tablet: 12px
--gap-desktop: 16px
```

## Component Patterns

### Location List
**Mobile**:
- Full width cards
- 56px minimum height per item
- Swipe gestures for delete
- Drag handle visible on touch

**Desktop**:
- Sidebar width: 320-400px
- Hover states for all interactions
- Drag and drop with visual feedback
- Context menu on right-click

### Search Section
**Mobile**:
- Full-screen overlay
- Large search input (48px height)
- Bottom sheet for results
- Swipe down to close

**Desktop**:
- Sidebar panel
- Dropdown results
- Keyboard navigation
- Real-time suggestions

### Map Section
**Mobile**:
- 50vh fixed height
- Bottom-aligned controls
- Pinch to zoom
- Touch pan

**Desktop**:
- Full height (minus header/footer)
- Top-right controls
- Mouse wheel zoom
- Click and drag pan

### Buttons
**Mobile**:
- Minimum 44x44px touch target
- Full-width primary actions
- Icon + text labels
- Bottom-aligned action buttons

**Desktop**:
- Minimum 36px height
- Auto-width with padding
- Hover states
- Keyboard focus visible

## Interaction Patterns

### Touch Interactions (Mobile/Tablet)
- **Tap**: Primary action
- **Long Press**: Secondary menu
- **Swipe**: Delete/dismiss
- **Drag**: Reorder items
- **Pinch**: Zoom map

### Mouse Interactions (Desktop)
- **Click**: Primary action
- **Hover**: Show tooltips/highlights
- **Right-Click**: Context menu
- **Drag**: Reorder items
- **Scroll**: Zoom map (with modifier key)

### Keyboard Interactions (All Devices)
- **Tab**: Navigate between elements
- **Enter**: Activate focused element
- **Escape**: Close modals/cancel
- **Arrow Keys**: Navigate lists
- **Delete**: Remove focused item

## Animation & Transitions

### Timing Functions
```css
--transition-fast: 150ms ease
--transition-normal: 200ms ease
--transition-slow: 300ms ease
--transition-bounce: 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

### Common Animations
- **Fade In**: Modals, toasts (200ms)
- **Slide In**: Side panels (300ms)
- **Scale**: Buttons on press (150ms)
- **Spin**: Loading indicators (1000ms linear infinite)

## Accessibility

### Touch Targets
- Minimum 44x44px for mobile
- Minimum 36x36px for desktop
- 8px minimum spacing between targets

### Color Contrast
- Text: Minimum 4.5:1 contrast ratio
- Large text: Minimum 3:1 contrast ratio
- Interactive elements: Clear visual indicators

### Focus States
- Visible focus outline on all interactive elements
- Skip navigation links
- Keyboard navigation support

### Screen Reader Support
- Semantic HTML structure
- ARIA labels for complex interactions
- Announcements for dynamic content updates

## Performance Considerations

### Mobile Optimization
- Lazy load map tiles
- Debounce search inputs (300ms)
- Virtual scrolling for long lists
- Optimize touch event handlers

### Desktop Optimization
- Preload adjacent map tiles
- Instant search suggestions
- Smooth scroll animations
- Hardware-accelerated transforms

## Component-Specific Guidelines

### LocationList Component
- **Mobile**: Stacked cards, full width
- **Desktop**: Sidebar list, fixed width
- Always show drag handles
- Color-coded by type (start/waypoint/end)

### SearchSection Component
- **Mobile**: Modal overlay
- **Desktop**: Inline sidebar panel
- Autocomplete after 2 characters
- Recent searches and favorites

### MapSection Component
- **Mobile**: Fixed 50vh height
- **Desktop**: Flexible height, min 60vh
- Responsive markers
- Adaptive zoom levels

### RouteSummary Component
- **Mobile**: Collapsible bottom sheet
- **Desktop**: Right sidebar panel
- Always visible when route exists
- Summary at top, details scrollable

### Footer Component
- **Mobile**: Minimal, collapsible
- **Desktop**: Full information
- Links to documentation
- Version information

## Implementation Notes

### CSS Architecture
- Use CSS custom properties (variables)
- Mobile-first media queries
- BEM naming convention (optional)
- Modular component styles

### Responsive Images
- SVG for icons and logos
- Responsive image sizing
- Lazy loading for below-fold content

### Z-Index Scale
```css
--z-base: 1
--z-dropdown: 100
--z-sticky: 200
--z-modal-backdrop: 900
--z-modal: 1000
--z-toast: 1100
--z-tooltip: 1200
```

## Testing Strategy

### Breakpoint Testing
- Test at exact breakpoint boundaries
- Test between breakpoints
- Test extreme sizes (320px, 4K)

### Device Testing
- iOS Safari (mobile)
- Chrome Android (mobile)
- Chrome Desktop
- Firefox Desktop
- Safari Desktop

### Interaction Testing
- Touch on mobile devices
- Mouse on desktop
- Keyboard navigation
- Screen reader compatibility

## Future Enhancements

### Potential Features
- Dark mode support
- Custom theme colors
- Adjustable density (compact/comfortable/spacious)
- Print-friendly styles
- RTL language support

### Performance Targets
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Lighthouse Score: > 90
- Core Web Vitals: All "Good"

---

**Document Version**: 1.0.0  
**Last Updated**: 2024  
**Status**: Active