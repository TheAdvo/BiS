# Known Issues

## Node.js Deprecation Warnings (Non-Critical)

**Issue**: Node.js shows deprecation warnings about trailing slash pattern mappings in package exports:

- `@iconify/utils@2.3.0`
- `@vue/shared@3.5.18`
- `@vueuse/core@13.5.0` (via reka-ui)

**Impact**: None - these are warnings only and don't affect functionality.

**Status**: Waiting for upstream package maintainers to update their package.json export patterns.

**Workaround**: These warnings can be ignored safely. They will be resolved automatically when the packages are updated by their maintainers.

**Example Warning**:

```
(node:xxxx) [DEP0155] DeprecationWarning: Use of deprecated trailing slash pattern mapping "./" in the "exports" field module resolution
```

## Performance Optimizations Completed

✅ Memory leak fixes (interval cleanup)
✅ API polling frequency optimization
✅ CSS animation overhead removal
✅ Bundle size optimization (104KB+ saved)
✅ Security vulnerabilities resolved
