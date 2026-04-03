# Ionic React Migration Guide

## Overview
This guide documents the migration from standard React components to Ionic React components for the Financial Coach application.

## Theme Configuration

The app uses a centralized theme system located in `src/theme/variables.css`. 

### Updating Brand Colors
To change the app's branding colors, modify the CSS variables in `src/theme/variables.css`:

```css
:root {
  /* Primary brand color - Main app color */
  --ion-color-primary: #0284c7;
  --ion-color-primary-rgb: 2, 132, 199;
  --ion-color-primary-shade: #0369a1;
  --ion-color-primary-tint: #0ea5e9;
  
  /* Secondary, Success, Warning, Danger colors */
  /* ... modify as needed ... */
}
```

## Component Migration Patterns

### Common Conversions

1. **Divs to Ionic Containers**
   - `<div>` → `<IonCard>`, `<IonCardContent>`, `<IonItem>`
   - Responsive grids: `<IonGrid>`, `<IonRow>`, `<IonCol>`

2. **Inputs**
   - `<input>` → `<IonInput>`
   - `<select>` → `<IonSelect>` with `<IonSelectOption>`
   - `<textarea>` → `<IonTextarea>`

3. **Buttons**
   - `<button>` → `<IonButton>`
   - Add `expand="block"` for full-width
   - Use `fill="clear"`, `fill="outline"`, or default solid

4. **Lists**
   - Tables → `<IonList>` with `<IonItem>`
   - Use `lines="full"`, `lines="inset"`, or `lines="none"`

5. **Progress Indicators**
   - Custom progress bars → `<IonProgressBar>` 
   - Loading spinners → `<IonSpinner>`

6. **Text**
   - Colored text → `<IonText color="primary|success|danger|warning">`
   - Headers → `<IonCardTitle>`, `<IonCardSubtitle>`

7. **Icons**
   - Import from `ionicons/icons`
   - Use with `<IonIcon icon={iconName} />`

8. **Modals**
   - Custom modals → `<IonModal>` with `isOpen` prop
   - Popovers → `<IonPopover>`

9. **Navigation**  
   - `<Link>` → Use `routerLink` prop on IonButton/IonItem
   - `useNavigate()` → `useHistory()` from react-router-dom

10. **Badges**
    - Span badges → `<IonBadge>`

## Best Practices

1. **Responsive Design**
   - Use `<IonGrid>`, `<IonRow>`, `<IonCol>` with size breakpoints
   - Example: `<IonCol size="12" sizeMd="6" sizeLg="4">`

2. **Color Theming**
   - Use color props: `color="primary|secondary|success|danger|warning|medium|light|dark"`
   - Custom colors defined in theme/variables.css (e.g., `income`, `expense`)

3. **Spacing**
   - Use Ionic utility classes: `ion-padding`, `ion-margin`, `ion-no-padding`
   - Or combine with Tailwind: `className="ion-padding-top mb-4"`

4. **Page Structure**
   - Authenticated pages wrapped in `<IonPage>` (in MainLayout)
   - Login/Register pages use `<IonPage>`, `<IonHeader>`, `<IonContent>`

5. **Forms**
   - Use `<IonItem>` to wrap inputs for consistent styling
   - Use `position="stacked"` or `position="floating"` for labels

## Files Modified

- ✅ `src/main.tsx` - Added Ionic CSS imports
- ✅ `src/App.tsx` - Migrated to IonReactRouter and IonApp
- ✅ `src/components/MainLayout.tsx` - Migrated to Ionic navigation
- ✅ `src/components/NotificationBell.tsx` - Migrated to IonPopover
- ✅ `src/pages/LoginPage.tsx` - Migrated to Ionic form components
- ✅ `src/pages/RegisterPage.tsx` - Migrated to Ionic form components
- ✅ `src/pages/DashboardPage.tsx` - Migrated to Ionic cards and grids
- ⏳ `src/pages/AccountsPage.tsx` - Pending
- ⏳ `src/pages/TransactionsPage.tsx` - Pending
- ⏳ `src/pages/BudgetsPage.tsx` - Pending
- ⏳ `src/pages/RecurringTransactionsPage.tsx` - Pending
- ⏳ `src/pages/ReportsPage.tsx` - Pending
- ⏳ `src/pages/InsightsPage.tsx` - Pending
- ⏳ `src/pages/AICoachPage.tsx` - Pending

## Testing

After migration:
1. Test on various screen sizes (mobile, tablet, desktop)
2. Verify all forms work correctly
3. Check navigation flows
4. Test dark mode support (defined in theme/variables.css)
5. Verify color consistency across components

## Mobile-Specific Enhancements

The Ionic migration includes:
- Touch-optimized buttons and inputs
- Native-like animations and transitions
- Responsive grid system
- Pull-to-refresh capability (can be added with `<IonRefresher>`)
- Virtual scrolling for long lists (can use `<IonVirtualScroll>`)
- Bottom sheet modals
- Swipe gestures support

## Future Enhancements

Consider adding:
- Pull-to-refresh on data-heavy pages
- Swipe-to-delete on list items
- Floating action buttons (FAB) for primary actions
- Toast notifications for feedback
- Loading skeletons for better UX
