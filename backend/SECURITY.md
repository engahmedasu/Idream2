# Security Notes

## Known Vulnerabilities

### ✅ RESOLVED: xlsx Package Migration

**Previous Status**: Known vulnerabilities, no fix available  
**Resolution Date**: January 2025  
**Action Taken**: Migrated from `xlsx` (v0.18.5) to `exceljs` (v4.4.0)

**Previous Vulnerabilities** (now resolved):
- GHSA-4r6h-8v6p-xvw6: Prototype Pollution in sheetJS
- GHSA-5pgg-2g8v-p4x9: SheetJS Regular Expression Denial of Service (ReDoS)

**Migration Details**:
- ✅ Replaced `xlsx` package with `exceljs` in `package.json`
- ✅ Updated all Excel generation code in `reportController.js`
- ✅ Enhanced Excel output with styled headers and auto-sized columns
- ✅ All 5 report types migrated (Shops, Products, Shares, Orders, Subscription Logs)
- ✅ Maintained same API interface (no breaking changes)

**Benefits of exceljs**:
- ✅ No known security vulnerabilities
- ✅ More actively maintained
- ✅ Better performance and features
- ✅ Enhanced styling capabilities (used for header row styling)
- ✅ Better TypeScript support

**Verification**:
- Run `npm audit` to confirm no vulnerabilities related to Excel generation

---

## General Security Best Practices

1. **Authentication**: All API routes (except public endpoints) require authentication
2. **Authorization**: Role-based and permission-based access control implemented
3. **Input Validation**: Express-validator and Mongoose schema validation
4. **Password Security**: bcryptjs with salt rounds for password hashing
5. **JWT Tokens**: Secure token-based authentication with expiration
6. **Database**: MongoDB with schema validation and proper indexing
7. **File Uploads**: Multer with file type and size restrictions
8. **CORS**: Configured to restrict cross-origin requests
9. **Environment Variables**: Sensitive data stored in `.env` files (not committed)
10. **Error Handling**: Generic error messages to avoid information leakage

## Reporting Security Issues

If you discover a security vulnerability, please:
1. Do NOT create a public GitHub issue
2. Contact the development team directly
3. Provide detailed information about the vulnerability
4. Allow reasonable time for remediation before public disclosure

---

**Last Updated**: January 2025  
**Next Review**: April 2025

