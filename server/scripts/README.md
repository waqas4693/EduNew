# S3 Orphaned Files Cleanup Script

This script helps clean up orphaned files in S3 storage by comparing them with database records.

## 🚀 Features

- **Comprehensive Analysis**: Lists all S3 files and compares with database references
- **Safe Deletion**: Batch deletion with error handling and rate limiting
- **Detailed Reporting**: Shows storage usage, cost savings, and deletion results
- **Dry Run Mode**: Preview what would be deleted without actually deleting
- **Pagination Support**: Handles large S3 buckets efficiently

## 📋 Prerequisites

- AWS credentials configured (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`)
- MongoDB connection (`MONGO_URL`)
- S3 bucket name (`S3_BUCKET_NAME`)

## 🛠️ Usage

### Dry Run (Preview)
```bash
npm run cleanup:dry-run
# or
node scripts/cleanup-orphaned-files.js --dry-run
```

### Live Cleanup
```bash
npm run cleanup
# or
node scripts/cleanup-orphaned-files.js
```

### Help
```bash
npm run cleanup:help
```

## 📊 What the Script Does

1. **Connects to MongoDB** and S3
2. **Lists all S3 files** with pagination
3. **Fetches all resource files** from database
4. **Identifies orphaned files** (S3 files not referenced in DB)
5. **Deletes orphaned files** in batches (live mode only)
6. **Generates detailed report** with statistics

## 🔍 File Types Handled

- Main resource files (`fileName`)
- Thumbnails (`thumbnailUrl`)
- Background images (`backgroundImage`)
- Audio files (`audioFile`)
- MCQ images (`mcq.imageFile`)
- MCQ audio files (`mcq.audioFile`)

## 📈 Report Includes

- Total S3 files count
- Database file references count
- Orphaned files count
- Storage usage (MB)
- Estimated cost savings
- Deletion success/error counts

## ⚠️ Safety Features

- **Dry run mode** for previewing changes
- **Batch processing** to avoid overwhelming S3
- **Error handling** for individual file deletions
- **Rate limiting** between batches
- **Detailed logging** for audit trail

## 🕐 Recommended Schedule

Run this script periodically to maintain clean storage:

```bash
# Weekly cleanup (add to crontab)
0 2 * * 0 cd /path/to/backend && npm run cleanup

# Monthly dry run for monitoring
0 2 1 * * cd /path/to/backend && npm run cleanup:dry-run
```

## 🔧 Configuration

The script uses environment variables from your `.env` file:

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
S3_BUCKET_NAME=your_bucket_name
MONGO_URL=your_mongodb_url
```

## 📝 Logs

The script provides detailed console output including:
- Connection status
- File discovery progress
- Deletion progress
- Error details
- Final summary report

## 🚨 Important Notes

- **Always run dry-run first** to preview changes
- **Backup your S3 bucket** before running live cleanup
- **Monitor the logs** for any errors
- **Test in development** before running in production 