# LicenseIQ Azure Deployment Guide
## Complete Lift & Shift Migration with PostgreSQL

This guide provides a comprehensive walkthrough for deploying LicenseIQ to Azure using a lift-and-shift approach with PostgreSQL Flexible Server.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Azure Resource Setup](#azure-resource-setup)
3. [PostgreSQL Flexible Server Setup](#postgresql-flexible-server-setup)
4. [Application Configuration](#application-configuration)
5. [Deployment Steps](#deployment-steps)
6. [Environment Variables](#environment-variables)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools
- Azure CLI installed and configured
- Node.js 20+ (for local testing)
- Git repository access
- Azure subscription with appropriate permissions

### Azure CLI Installation
```bash
# Windows (using winget)
winget install -e --id Microsoft.AzureCLI

# macOS (using Homebrew)
brew install azure-cli

# Linux (Ubuntu/Debian)
curl -sL https://aka.ms/InstallAzureCLI | sudo bash
```

### Login to Azure
```bash
az login
az account set --subscription "your-subscription-id"
```

## Azure Resource Setup

### 1. Create Resource Group
```bash
# Set variables
export RESOURCE_GROUP="licenseiq-prod"
export LOCATION="East US"
export APP_NAME="licenseiq-app"
export DB_SERVER_NAME="licenseiq-db-server"

# Create resource group
az group create --name $RESOURCE_GROUP --location "$LOCATION"
```

### 2. Create App Service Plan
```bash
# Create App Service Plan (Production tier for better performance)
az appservice plan create \
  --name "${APP_NAME}-plan" \
  --resource-group $RESOURCE_GROUP \
  --location "$LOCATION" \
  --sku P1V3 \
  --is-linux
```

## PostgreSQL Flexible Server Setup

### 1. Create PostgreSQL Flexible Server
```bash
# Create PostgreSQL Flexible Server
az postgres flexible-server create \
  --name $DB_SERVER_NAME \
  --resource-group $RESOURCE_GROUP \
  --location "$LOCATION" \
  --admin-user licenseiqadmin \
  --admin-password "YourSecurePassword123!" \
  --sku-name Standard_B2s \
  --tier Burstable \
  --storage-size 128 \
  --version 14 \
  --public-access 0.0.0.0
```

### 2. Configure Database
```bash
# Create application database
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER_NAME \
  --database-name licenseiq

# Configure firewall rule to allow Azure services
az postgres flexible-server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER_NAME \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

### 3. Get Database Connection String
```bash
# Get connection details
az postgres flexible-server show \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER_NAME \
  --query "fullyQualifiedDomainName" \
  --output tsv
```

## Application Configuration

### 1. Update package.json for Azure Deployment
Create a `package.json` deployment script:

```json
{
  "scripts": {
    "start": "node server/index.js",
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build",
    "build:server": "tsc --project server/tsconfig.json",
    "postinstall": "npm run build"
  },
  "engines": {
    "node": "20.x",
    "npm": "10.x"
  }
}
```

### 2. Create Azure-specific Configuration Files

Create `.deployment` file:
```ini
[config]
SCM_DO_BUILD_DURING_DEPLOYMENT=true
WEBSITE_NODE_DEFAULT_VERSION=20.11.0
```

Create `web.config` for Azure App Service:
```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server/index.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True"/>
          </conditions>
          <action type="Rewrite" url="server/index.js"/>
        </rule>
      </rules>
    </rewrite>
    <security>
      <requestFiltering removeServerHeader="true"/>
    </security>
    <httpErrors existingResponse="PassThrough" />
  </system.webServer>
</configuration>
```

### 3. Environment Configuration
Create `azure-env-template.txt`:
```bash
# Database Configuration
DATABASE_URL=postgresql://licenseiqadmin:YourSecurePassword123!@licenseiq-db-server.postgres.database.azure.com:5432/licenseiq?sslmode=require

# Session Configuration
SESSION_SECRET=your-super-secure-session-secret-here

# Groq API Configuration
GROQ_API_KEY=your-groq-api-key-here

# Application Configuration
NODE_ENV=production
PORT=8080
WEBSITE_HOSTNAME=licenseiq-app.azurewebsites.net

# Azure-specific
WEBSITES_ENABLE_APP_SERVICE_STORAGE=false
WEBSITE_NODE_DEFAULT_VERSION=20.11.0
```

## Deployment Steps

### 1. Create Web App
```bash
# Create the web app
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan "${APP_NAME}-plan" \
  --name $APP_NAME \
  --runtime "NODE:20-lts" \
  --deployment-local-git
```

### 2. Configure Application Settings
```bash
# Set Node.js version
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings WEBSITE_NODE_DEFAULT_VERSION=20.11.0

# Set startup command
az webapp config set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --startup-file "npm start"

# Configure environment variables
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings \
    NODE_ENV=production \
    PORT=8080 \
    DATABASE_URL="postgresql://licenseiqadmin:YourSecurePassword123!@${DB_SERVER_NAME}.postgres.database.azure.com:5432/licenseiq?sslmode=require" \
    SESSION_SECRET="your-super-secure-session-secret-here" \
    GROQ_API_KEY="your-groq-api-key-here"
```

### 3. Deploy Application Code

#### Option A: Git Deployment
```bash
# Get Git URL
GITURL=$(az webapp deployment source config-local-git \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query url --output tsv)

# Add Azure remote
git remote add azure $GITURL

# Deploy
git push azure main
```

#### Option B: ZIP Deployment
```bash
# Create deployment package
npm run build
zip -r licenseiq-deploy.zip . -x "node_modules/*" ".git/*" "*.log"

# Deploy ZIP
az webapp deployment source config-zip \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --src licenseiq-deploy.zip
```

### 4. Database Schema Migration
```bash
# SSH into the app service for database setup
az webapp ssh --resource-group $RESOURCE_GROUP --name $APP_NAME

# Inside the SSH session:
cd /home/site/wwwroot
npm run db:push --force
```

## Environment Variables

### Required Environment Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@server.postgres.database.azure.com:5432/db?sslmode=require` |
| `SESSION_SECRET` | Session encryption key | `super-secure-random-string-here` |
| `GROQ_API_KEY` | Groq AI API key | `gsk_xxxxxxxxxxxxx` |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Application port | `8080` |

### Set Environment Variables
```bash
# Set all environment variables at once
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings @azure-env-vars.json
```

Create `azure-env-vars.json`:
```json
[
  {
    "name": "DATABASE_URL",
    "value": "postgresql://licenseiqadmin:YourSecurePassword123!@licenseiq-db-server.postgres.database.azure.com:5432/licenseiq?sslmode=require"
  },
  {
    "name": "SESSION_SECRET",
    "value": "your-super-secure-session-secret-here"
  },
  {
    "name": "GROQ_API_KEY",
    "value": "your-groq-api-key-here"
  },
  {
    "name": "NODE_ENV",
    "value": "production"
  },
  {
    "name": "PORT",
    "value": "8080"
  }
]
```

## Post-Deployment Verification

### 1. Health Check
```bash
# Check application status
az webapp show \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --query "state" \
  --output tsv

# Check logs
az webapp log tail \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME
```

### 2. Database Connectivity Test
```bash
# Test database connection
curl -X GET "https://${APP_NAME}.azurewebsites.net/api/health"
```

### 3. Application Functionality Test
- Navigate to `https://licenseiq-app.azurewebsites.net`
- Test user authentication
- Upload a contract and verify AI processing
- Check royalty rule extraction

## SSL/TLS Configuration

### 1. Enable HTTPS Only
```bash
az webapp update \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --https-only true
```

### 2. Custom Domain (Optional)
```bash
# Add custom domain
az webapp config hostname add \
  --webapp-name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --hostname "yourdomain.com"

# Enable managed certificate
az webapp config ssl create \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --hostname "yourdomain.com"
```

## Monitoring and Logging

### 1. Enable Application Insights
```bash
# Create Application Insights
az monitor app-insights component create \
  --app licenseiq-insights \
  --location "$LOCATION" \
  --resource-group $RESOURCE_GROUP \
  --kind web

# Get instrumentation key
INSIGHTS_KEY=$(az monitor app-insights component show \
  --app licenseiq-insights \
  --resource-group $RESOURCE_GROUP \
  --query "instrumentationKey" \
  --output tsv)

# Configure App Service to use Application Insights
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY=$INSIGHTS_KEY
```

### 2. Configure Log Stream
```bash
# Enable application logging
az webapp log config \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --application-logging true \
  --level information

# View live logs
az webapp log tail \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME
```

## Backup and Recovery

### 1. Database Backup
```bash
# Enable automated backups for PostgreSQL
az postgres flexible-server parameter set \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER_NAME \
  --name backup_retention_days \
  --value 30
```

### 2. Application Backup
```bash
# Create storage account for backups
az storage account create \
  --name licenseiqbackups \
  --resource-group $RESOURCE_GROUP \
  --location "$LOCATION" \
  --sku Standard_LRS

# Configure automatic backups
az webapp config backup update \
  --resource-group $RESOURCE_GROUP \
  --webapp-name $APP_NAME \
  --container-url "https://licenseiqbackups.blob.core.windows.net/backups" \
  --frequency 1 \
  --frequency-unit Day \
  --retain-one true \
  --retention-period-in-days 30
```

## Scaling Configuration

### 1. Auto-scaling Rules
```bash
# Create auto-scale settings
az monitor autoscale create \
  --resource-group $RESOURCE_GROUP \
  --resource "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/serverfarms/${APP_NAME}-plan" \
  --name "${APP_NAME}-autoscale" \
  --min-count 1 \
  --max-count 5 \
  --count 2

# Add scale-out rule (CPU > 70%)
az monitor autoscale rule create \
  --resource-group $RESOURCE_GROUP \
  --autoscale-name "${APP_NAME}-autoscale" \
  --condition "Percentage CPU > 70 avg 5m" \
  --scale out 1

# Add scale-in rule (CPU < 30%)
az monitor autoscale rule create \
  --resource-group $RESOURCE_GROUP \
  --autoscale-name "${APP_NAME}-autoscale" \
  --condition "Percentage CPU < 30 avg 5m" \
  --scale in 1
```

## Security Configuration

### 1. Network Security
```bash
# Configure IP restrictions (optional)
az webapp config access-restriction add \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --rule-name "AllowOfficeIP" \
  --action Allow \
  --ip-address "203.0.113.0/24" \
  --priority 100
```

### 2. Managed Identity
```bash
# Enable system-assigned managed identity
az webapp identity assign \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Application Won't Start
- **Symptom**: App shows "Service Unavailable"
- **Check**: Application logs via `az webapp log tail`
- **Solution**: Verify `package.json` start script and Node.js version

#### 2. Database Connection Issues
- **Symptom**: Database connection errors
- **Check**: Firewall rules and connection string
- **Solution**: Ensure PostgreSQL allows Azure services and connection string is correct

#### 3. Build Failures
- **Symptom**: Deployment succeeds but app crashes
- **Check**: Kudu logs at `https://licenseiq-app.scm.azurewebsites.net`
- **Solution**: Verify all dependencies are in `package.json`, not `devDependencies`

#### 4. File Upload Issues
- **Symptom**: Contract uploads fail
- **Check**: File system permissions and temp directory
- **Solution**: Use Azure Blob Storage for file uploads in production

### Debug Commands
```bash
# Check app status
az webapp show --resource-group $RESOURCE_GROUP --name $APP_NAME --query "state"

# View configuration
az webapp config show --resource-group $RESOURCE_GROUP --name $APP_NAME

# Check environment variables
az webapp config appsettings list --resource-group $RESOURCE_GROUP --name $APP_NAME

# Restart application
az webapp restart --resource-group $RESOURCE_GROUP --name $APP_NAME
```

## Performance Optimization

### 1. CDN Configuration
```bash
# Create CDN profile
az cdn profile create \
  --name licenseiq-cdn \
  --resource-group $RESOURCE_GROUP \
  --sku Standard_Microsoft

# Create CDN endpoint
az cdn endpoint create \
  --name licenseiq-endpoint \
  --profile-name licenseiq-cdn \
  --resource-group $RESOURCE_GROUP \
  --origin licenseiq-app.azurewebsites.net
```

### 2. Caching Headers
Add to your Express app:
```javascript
app.use((req, res, next) => {
  if (req.path.includes('/static/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
  next();
});
```

## Cost Optimization

### 1. Reserved Instances
- Consider Reserved Instances for long-term deployments
- Use Azure Cost Calculator for estimates

### 2. Resource Right-sizing
- Monitor CPU and memory usage
- Scale down during low-usage periods
- Use Burstable PostgreSQL tiers for development

## Maintenance

### 1. Regular Updates
```bash
# Update Node.js runtime
az webapp config set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --linux-fx-version "NODE:20-lts"

# Update application
git push azure main
```

### 2. Health Monitoring
- Set up Application Insights alerts
- Monitor database performance
- Regular backup verification

---

## Quick Reference Commands

### Deployment Checklist
- [ ] Azure CLI installed and logged in
- [ ] Resource group created
- [ ] PostgreSQL Flexible Server created
- [ ] Database and firewall configured
- [ ] App Service plan and web app created
- [ ] Environment variables set
- [ ] Application deployed
- [ ] Database schema migrated
- [ ] SSL/HTTPS enabled
- [ ] Monitoring configured
- [ ] Backup strategy implemented

### Essential URLs
- Application: `https://licenseiq-app.azurewebsites.net`
- Kudu (SCM): `https://licenseiq-app.scm.azurewebsites.net`
- Application Insights: Azure Portal > licenseiq-insights

### Support Resources
- Azure Documentation: https://docs.microsoft.com/azure
- PostgreSQL Flexible Server: https://docs.microsoft.com/azure/postgresql/flexible-server
- App Service: https://docs.microsoft.com/azure/app-service

---

**Note**: Replace placeholder values (passwords, API keys, domain names) with your actual values before deployment. Store sensitive information securely and never commit secrets to version control.