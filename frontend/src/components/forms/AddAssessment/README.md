# AddAssessment Component Documentation

## Overview
This is a refactored and compartmentalized version of the original `AddAssessment.jsx` component. The component has been broken down into smaller, focused components and custom hooks for better maintainability, reusability, and testability.

## Structure

```
AddAssessment/
├── index.jsx                           # Main component (80 lines)
├── components/
│   ├── forms/                          # Form-specific components
│   │   ├── AssessmentBasicInfo.jsx     # Title, description fields
│   │   ├── AssessmentMetrics.jsx       # Marks, percentage, interval
│   │   ├── AssessmentTypeSelector.jsx  # Assessment type dropdown
│   │   ├── MCQForm/                    # MCQ-specific components
│   │   │   ├── index.jsx               # Main MCQ form
│   │   │   ├── MCQItem.jsx             # Individual MCQ
│   │   │   ├── MCQOptions.jsx          # Options management
│   │   │   └── MCQFileUpload.jsx       # File uploads
│   │   ├── QNAForm.jsx                 # Questions form
│   │   ├── FileAssessmentForm.jsx      # File upload form
│   │   ├── TimeOptionsForm.jsx         # Time-bound settings
│   │   └── RoleSelectionForm.jsx       # Assessor/moderator/verifier
│   ├── selectors/                      # Dropdown selectors
│   │   ├── CourseSelector.jsx
│   │   ├── UnitSelector.jsx
│   │   └── SectionSelector.jsx
│   └── ui/                             # Reusable UI components
│       ├── FormSection.jsx
│       ├── SuccessMessage.jsx
│       ├── ErrorMessage.jsx
│       └── SubmitButton.jsx
├── hooks/                              # Custom hooks
│   ├── useAssessmentForm.js            # Form state management
│   ├── useAssessmentAPI.js             # API operations
│   ├── useHierarchyData.js             # Course/unit/section data
│   ├── useMCQManagement.js             # MCQ-specific logic
│   ├── useFormValidation.js            # Validation logic
│   └── useFileUpload.js                # File upload operations
├── utils/                              # Utility functions
│   ├── constants.js                    # Constants and enums
│   ├── validationRules.js              # Validation functions
│   ├── fileHelpers.js                  # File processing
│   └── assessmentHelpers.js            # Assessment utilities
└── types/
    └── assessmentTypes.js              # PropTypes definitions
```

## Usage

### Using the New Component
```jsx
import AddAssessment from './components/forms/AddAssessment'

// The component can be used as a drop-in replacement
function App() {
  return <AddAssessment />
}
```

### Switching Between Old and New
To use the original component:
```jsx
import AddAssessment from './components/forms/AddAssessment.jsx'
```

To use the refactored component:
```jsx
import AddAssessment from './components/forms/AddAssessment'
```

## Key Features

### 🎯 **Separation of Concerns**
- **Form State**: Managed by `useAssessmentForm`
- **API Operations**: Handled by `useAssessmentAPI`
- **Data Hierarchies**: Managed by `useHierarchyData`
- **MCQ Logic**: Isolated in `useMCQManagement`
- **Validation**: Centralized in `useFormValidation`

### 🔄 **Reusable Components**
- All form components are reusable across other assessment forms
- UI components follow consistent styling patterns
- Selectors can be used in other parts of the application

### 🧪 **Testability**
- Small, focused components are easier to unit test
- Custom hooks can be tested independently
- Utility functions have clear inputs and outputs

### 📱 **Maintainability**
- Each file has a single responsibility
- Clear component boundaries
- Consistent naming conventions

## Benefits Over Original

1. **Reduced Complexity**: Main component is only 80 lines vs 1344 lines
2. **Better Error Handling**: Centralized error management
3. **Improved Performance**: Smaller component bundles
4. **Enhanced Developer Experience**: Easier to locate and modify functionality
5. **Code Reusability**: Components can be reused in other assessment forms

## Migration Notes

- The original `AddAssessment.jsx` file remains untouched
- All functionality is preserved in the new structure
- The API remains the same - it's a drop-in replacement
- PropTypes are included for better development experience

## Future Enhancements

- Add unit tests for all components and hooks
- Implement error boundaries for better error handling
- Add internationalization support
- Consider adding Storybook stories for component documentation
