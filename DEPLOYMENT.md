# Deployment Guide - GroupTherapy Records

This guide covers deploying the GroupTherapy Records website to production.

## Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations run successfully
- [ ] Cloudinary upload preset created
- [ ] Spotify API credentials verified
- [ ] Gemini AI API key tested
- [ ] Admin credentials set
- [ ] SSL certificate configured
- [ ] Domain DNS configured
- [ ] Backup strategy in place

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel provides excellent performance and easy deployment for React applications.

#### Steps:

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Configure Project**
```bash
vercel
```

4. **Set Environment Variables**
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
# ... add all other environment variables
```

Or use the Vercel dashboard to add all environment variables at once.

5. **Deploy**
```bash
vercel --prod
```

#### Vercel Configuration

Create a `vercel.json` file in the root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/assets/(.*)",
      "dest": "/assets/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### Option 2: Netlify

Netlify is another excellent option for static site hosting.

#### Steps:

1. **Install Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **Login**
```bash
netlify login
```

3. **Initialize**
```bash
netlify init
```

4. **Configure Build Settings**
- Build command: `npm run build`
- Publish directory: `dist`

5. **Set Environment Variables**
Use Netlify dashboard to add all environment variables

6. **Deploy**
```bash
netlify deploy --prod
```

#### Netlify Configuration

Create a `netlify.toml` file:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

### Option 3: Self-Hosted (VPS/Cloud Server)

For more control, deploy on your own server.

#### Requirements:
- Ubuntu 20.04+ or similar Linux distribution
- Node.js 18+
- Nginx
- SSL certificate (Let's Encrypt)

#### Steps:

1. **Setup Server**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

2. **Clone Repository**
```bash
cd /var/www
git clone https://github.com/egypcoder/grouptherapy-production.git
cd grouptherapy-production
```

3. **Install Dependencies**
```bash
npm install
```

4. **Configure Environment**
```bash
# Create .env file
nano .env
# Add all environment variables
```

5. **Build Application**
```bash
npm run build
```

6. **Configure Nginx**
```bash
sudo nano /etc/nginx/sites-available/grouptherapy
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    root /var/www/grouptherapy-production/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

7. **Enable Site**
```bash
sudo ln -s /etc/nginx/sites-available/grouptherapy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

8. **Setup SSL with Let's Encrypt**
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

9. **Setup Auto-Deployment (Optional)**
```bash
# Create deployment script
nano /var/www/grouptherapy-production/deploy.sh
```

Add:
```bash
#!/bin/bash
cd /var/www/grouptherapy-production
git pull origin main
npm install
npm run build
sudo systemctl restart nginx
```

Make executable:
```bash
chmod +x deploy.sh
```

## Post-Deployment Tasks

### 1. Verify Deployment
- [ ] Check all pages load correctly
- [ ] Test admin login
- [ ] Verify Spotify integration
- [ ] Test image/audio uploads
- [ ] Check newsletter signup
- [ ] Test contact form
- [ ] Verify awards voting
- [ ] Test mobile responsiveness

### 2. Setup Monitoring

#### Vercel/Netlify
- Use built-in analytics
- Setup error tracking (e.g., Sentry)

#### Self-Hosted
Install monitoring tools:
```bash
# Install monitoring
sudo npm install -g pm2
pm2 startup
pm2 save

# Setup log monitoring
pm2 install pm2-logrotate
```

### 3. Configure Backups

#### Database Backups
```bash
# Setup automated Supabase backups
# Or use Supabase's built-in backup features
```

#### Code Backups
```bash
# Ensure repository is properly backed up on GitHub
git remote -v
```

### 4. Setup Domain

1. **Configure DNS**
```
A Record: @ -> Your Server IP
CNAME Record: www -> yourdomain.com
```

2. **Verify SSL**
```bash
# Check SSL certificate
curl -I https://yourdomain.com
```

### 5. Performance Optimization

#### Enable CDN (Optional)
- Cloudflare (recommended)
- Fastly
- KeyCDN

#### Configure Caching
```nginx
# Add to Nginx config
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 365d;
    add_header Cache-Control "public, no-transform";
}
```

## Environment-Specific Settings

### Production Environment Variables
```env
NODE_ENV=production
VITE_API_URL=https://api.yourdomain.com
```

### Staging Environment
Create a separate `.env.staging` file for testing before production deployment.

## Rollback Procedure

If issues occur after deployment:

### Vercel/Netlify
1. Go to dashboard
2. Find previous deployment
3. Click "Rollback"

### Self-Hosted
```bash
cd /var/www/grouptherapy-production
git log --oneline
git checkout <previous-commit-hash>
npm install
npm run build
sudo systemctl restart nginx
```

## Monitoring and Maintenance

### Regular Tasks
- [ ] Check error logs weekly
- [ ] Monitor database size
- [ ] Review analytics
- [ ] Update dependencies monthly
- [ ] Test backups quarterly
- [ ] Review security settings

### Log Files

#### Vercel/Netlify
- Use built-in logging dashboard
- Setup log drains if needed

#### Self-Hosted
```bash
# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# View application logs
pm2 logs
```

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Rotate API keys regularly
   - Use strong admin passwords

2. **Database**
   - Enable Row Level Security (RLS) in Supabase
   - Regular security audits
   - Monitor for suspicious activity

3. **Server** (if self-hosted)
   - Keep system updated
   - Configure firewall
   - Regular security patches
   - Disable root SSH login

4. **Application**
   - Keep dependencies updated
   - Monitor for vulnerabilities
   - Implement rate limiting
   - Use HTTPS only

## Troubleshooting Common Issues

### Build Fails
- Check Node.js version compatibility
- Clear node_modules and reinstall
- Verify all environment variables are set

### Database Connection Issues
- Verify Supabase credentials
- Check firewall rules
- Ensure RLS policies are correct

### Upload Failures
- Verify Cloudinary credentials
- Check upload preset configuration
- Ensure proper file size limits

### Performance Issues
- Enable caching
- Optimize images
- Use CDN
- Monitor database queries

## Support

For deployment issues:
- GitHub: https://github.com/egypcoder/grouptherapy-production
- Email: osama@grouptherapyeg.com

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [Supabase Documentation](https://supabase.com/docs)
- [Nginx Documentation](https://nginx.org/en/docs)
