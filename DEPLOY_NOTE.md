# Deploy note

The frontend reads the backend URL from the `REACT_APP_API_BASE` environment
variable at build time (see src/config.js). It must be set in Vercel for the
**Production** environment, and a fresh build (not a cached redeploy) is required
for a change to take effect.
