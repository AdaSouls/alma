# Deployment Guide

Complete guide for deploying the $ALMA website to Vercel.

## Prerequisites

- GitHub account
- Vercel account (free tier works)
- Blockfrost API key for Cardano (https://blockfrost.io)
- Smart contracts built and configured

## Step 1: Prepare the Repository

1. **Initialize Git** (if not already done):
   ```bash
   cd /Users/matifalcone/Projects/alma-adasouls
   git init
   git add .
   git commit -m "Initial commit: ALMA soulbound token minting site"
   ```

2. **Create GitHub Repository**:
   - Go to https://github.com/new
   - Create a new repository named `alma-adasouls`
   - Don't initialize with README (we already have one)

3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/alma-adasouls.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Configure Environment

1. **Create `.env` file locally** (for development):
   ```bash
   cp .env.example .env
   ```

2. **Add your Blockfrost API key**:
   ```
   VITE_BLOCKFROST_API_KEY=your_actual_api_key
   VITE_NETWORK=Preview
   ```

   ⚠️ **Never commit the `.env` file** - it's in `.gitignore`

## Step 3: Build Smart Contracts

1. **Build the Aiken contracts**:
   ```bash
   cd /Users/matifalcone/Projects/Cardano-Soulbound
   aiken build
   ```

2. **Copy compiled contracts**:
   ```bash
   cp plutus.json /Users/matifalcone/Projects/alma-adasouls/src/contracts/
   ```

3. **Update contract loader** in `src/utils/contract.ts`:
   - Uncomment the import line
   - Update the `loadValidators()` function to use the actual plutus.json

## Step 4: Local Testing

1. **Install dependencies**:
   ```bash
   cd /Users/matifalcone/Projects/alma-adasouls
   npm install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   ```

3. **Test the application**:
   - Open http://localhost:3000
   - Connect your Cardano wallet (Preview network)
   - Test minting with Preview testnet ADA
   - Verify transactions on CardanoScan Preview

## Step 5: Deploy to Vercel

### Option A: Vercel CLI (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Follow the prompts**:
   - Link to existing project or create new? → Create new
   - Project name? → alma-adasouls
   - Directory? → ./
   - Override settings? → No

5. **Set environment variables**:
   ```bash
   vercel env add VITE_BLOCKFROST_API_KEY
   vercel env add VITE_NETWORK
   ```

6. **Deploy to production**:
   ```bash
   vercel --prod
   ```

### Option B: Vercel Dashboard

1. **Import Project**:
   - Go to https://vercel.com/new
   - Click "Import Git Repository"
   - Select your `alma-adasouls` repository
   - Click "Import"

2. **Configure Project**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Add Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add:
     ```
     VITE_BLOCKFROST_API_KEY = your_api_key
     VITE_NETWORK = Preview
     ```

4. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Your site is live! 🎉

## Step 6: Custom Domain (Optional)

1. **Add custom domain in Vercel**:
   - Go to Project Settings → Domains
   - Add your domain (e.g., `alma.aldea-dao.org`)

2. **Configure DNS**:
   - Add CNAME record pointing to `cname.vercel-dns.com`
   - Or use Vercel nameservers for full management

3. **SSL Certificate**:
   - Automatically provisioned by Vercel
   - Usually takes 1-2 minutes

## Step 7: Production Checklist

Before switching to Mainnet:

- [ ] Test all 5 minting levels on Preview
- [ ] Verify wallet connections work
- [ ] Check mobile responsiveness
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Brave)
- [ ] Verify metadata structure
- [ ] Audit smart contracts
- [ ] Test claiming flow
- [ ] Update navigation links (Gitbook, Autonomous World)
- [ ] Set up monitoring/analytics
- [ ] Prepare customer support channels

## Step 8: Switch to Mainnet

1. **Get Mainnet Blockfrost API key**

2. **Update environment variable**:
   ```bash
   vercel env add VITE_NETWORK production
   # Enter value: Mainnet
   ```

3. **Update Blockfrost API key**:
   ```bash
   vercel env add VITE_BLOCKFROST_API_KEY production
   # Enter mainnet API key
   ```

4. **Redeploy**:
   ```bash
   vercel --prod
   ```

## Step 9: Monitoring

1. **Vercel Analytics**:
   - Enable in Project Settings → Analytics
   - Track page views, performance, and Web Vitals

2. **Transaction Monitoring**:
   - Monitor via Blockfrost dashboard
   - Set up alerts for failed transactions
   - Track minting statistics

3. **Error Tracking** (Optional):
   - Integrate Sentry or similar service
   - Track JavaScript errors in production

## Continuous Deployment

Once set up, Vercel will automatically:
- Deploy on every push to `main` branch
- Run preview deployments for pull requests
- Invalidate CDN cache automatically
- Generate unique URLs for each deployment

## Rollback

If something goes wrong:

1. **Via Vercel Dashboard**:
   - Go to Deployments
   - Find previous working deployment
   - Click "..." → "Promote to Production"

2. **Via Git**:
   ```bash
   git revert HEAD
   git push origin main
   ```

## Performance Optimization

The site is already optimized with:
- ✅ Code splitting by route
- ✅ Vendor chunk separation
- ✅ Minified production build
- ✅ Optimized images (SVG logos)
- ✅ Lazy loading for heavy components
- ✅ CDN distribution via Vercel Edge Network

Expected performance:
- **First Load**: < 1s
- **Time to Interactive**: < 2s
- **Lighthouse Score**: 95+

## Troubleshooting

### Build Fails
- Check Node.js version (18+ recommended)
- Verify all dependencies are in `package.json`
- Check build logs for specific errors

### Environment Variables Not Working
- Ensure they're prefixed with `VITE_`
- Redeploy after adding variables
- Check they're set for production environment

### Wallet Connection Issues
- Verify Blockfrost API key is correct
- Check network matches (Preview vs Mainnet)
- Test with multiple wallets

### Smart Contract Errors
- Verify plutus.json is correct
- Check policy configuration
- Ensure contracts are built for correct network

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Vite Docs**: https://vitejs.dev
- **Lucid Docs**: https://lucid.spacebudz.io
- **Cardano Docs**: https://docs.cardano.org

## Security Notes

- 🔒 Never commit API keys or private keys
- 🔒 Use environment variables for sensitive data
- 🔒 Enable Vercel password protection for preview deployments
- 🔒 Set up proper CORS if adding API routes
- 🔒 Regularly update dependencies for security patches
