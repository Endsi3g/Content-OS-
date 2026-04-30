# Code Signing Instructions for Content OS

To remove Windows SmartScreen warnings and provide a professional installation experience, you must sign your executable with a valid certificate.

## 1. Prerequisites
- A valid Code Signing Certificate (usually a `.pfx` or `.p12` file).
- The password for the certificate.

## 2. Configuration
1. **Place your certificate**: Save your `.pfx` file as `build/certificate.pfx`.
   > [!IMPORTANT]
   > Ensure this file is NOT committed to Git. It should already be in `.gitignore` if you use standard Electron templates, but double-check.

2. **Set Environment Variables**:
   On Windows (PowerShell):
   ```powershell
   $env:WIN_CSC_LINK = "build/certificate.pfx"
   $env:WIN_CSC_PASSWORD = "your_certificate_password"
   ```
   
   Alternatively, you can create a `.env` file in the root directory (though `electron-builder` mostly looks at environment variables during the build process):
   ```env
   WIN_CSC_LINK=build/certificate.pfx
   WIN_CSC_PASSWORD=your_certificate_password
   ```

## 3. Verifying the Certificate
Run the following script to check if `electron-builder` can see your configuration:

```powershell
pnpm exec electron-builder --preview
```

## 4. Building for Production
When you are ready to build and sign:
```powershell
pnpm run build:win
```

## Troubleshooting
- **SmartScreen still appears**: It takes time and a number of successful installations for a new certificate to gain "reputation" with Microsoft, unless you use an **EV (Extended Validation)** certificate which provides instant reputation.
- **Certificate not found**: Ensure the path in `WIN_CSC_LINK` is relative to the project root or an absolute path.
