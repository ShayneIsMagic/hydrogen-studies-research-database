# Webflow Embed Instructions

## 🚀 Quick Setup Guide

### Component 1: Hydrogen Research Timeline Chart

**What you need:**
- Chart.js CDN (for the chart functionality)
- The chart HTML/CSS/JS code

**Steps:**
1. **Add Chart.js CDN to your site:**
   - Go to Site Settings → Custom Code → Head Code
   - Add: `<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>`

2. **Add the chart component:**
   - Drag an Embed element to your page
   - Copy the entire content inside the `hydrogen-chart-container` div from the Timeline Chart artifact
   - Paste it into the Embed element

3. **Add the CSS:**
   - Go to Site Settings → Custom Code → Head Code
   - Copy all the CSS from the Timeline Chart artifact (the styles inside `<style>` tags)
   - Wrap in `<style>` tags and add to Head Code

---

### Component 2: Hydrogen Research Stats Grid

**What you need:**
- Just the stats HTML/CSS/JS code (no external dependencies)

**Steps:**
1. **Add the stats component:**
   - Drag an Embed element to your page
   - Copy the entire content inside the `hydrogen-stats-container` div from the Stats Grid artifact
   - Paste it into the Embed element

2. **Add the CSS:**
   - Copy all the CSS from the Stats Grid artifact
   - Add to your Site Settings → Custom Code → Head Code wrapped in `<style>` tags

---

## 📋 Copy-Paste Checklist

### For Timeline Chart:
- [ ] Add Chart.js CDN to head
- [ ] Copy chart container HTML to Embed element  
- [ ] Copy chart CSS to head code
- [ ] Test that chart loads and responds to controls

### For Stats Grid:
- [ ] Copy stats container HTML to Embed element
- [ ] Copy stats CSS to head code  
- [ ] Test that numbers animate on scroll

---

## 🎨 Customization Options

### Timeline Chart Colors:
```css
/* Change primary blue color */
--primary-blue: #your-color;

/* Change gradient colors in the JavaScript */
primary: '#your-color',
gradient1: 'rgba(your-color, 0.8)',
```

### Stats Grid:
```css
/* Change card colors */
.hydrogen-stat-card:nth-child(1)::before {
    background: linear-gradient(135deg, #your-color1, #your-color2);
}
```

### Stats Data:
Update the `data-target` attributes in the HTML:
```html
<div class="hydrogen-stat-number" data-target="1284">0</div>
```

---

## 🔧 Advanced Options

### Manual Animation Trigger:
If you need to trigger stats animation manually:
```javascript
window.triggerHydrogenStatsAnimation();
```

### Responsive Breakpoints:
Both components are fully responsive with breakpoints at:
- 768px (tablet)
- 480px (mobile)

### Chart Data Updates:
To update the chart data, modify the `hydrogenStudiesData` array in the JavaScript.

---

## 📱 Mobile Optimization

Both components are optimized for mobile with:
- Responsive grid layouts
- Touch-friendly controls
- Readable typography scaling
- Optimized spacing for small screens

---

## 🐛 Troubleshooting

**Chart not showing:**
- Ensure Chart.js CDN is loaded
- Check browser console for errors
- Verify the canvas element has an ID

**Stats not animating:**
- Check if Intersection Observer is supported
- Use manual trigger as fallback
- Verify CSS animations are enabled

**Mobile layout issues:**
- Ensure viewport meta tag is present
- Check CSS media queries are loaded
- Test on actual devices, not just browser resize

---

## 💡 Pro Tips

1. **Performance:** The chart initializes automatically but you can delay it for faster page loads
2. **SEO:** Add alt text and descriptions for accessibility
3. **Analytics:** Track user interactions with chart controls
4. **Loading:** Consider adding loading states for better UX