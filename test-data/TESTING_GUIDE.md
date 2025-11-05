# 🧪 Complete ERP Semantic Matching - Testing Guide

## 📋 Overview
This guide will walk you through testing the complete ERP semantic matching feature from start to finish.

## 📦 Test Files Provided
1. **erp_master_data_sample.csv** - ERP master data (15 products)
2. **sales_data_sample.csv** - Sales transactions (15 transactions)
3. **Contract PDF** - Use the existing Plant Variety License contract in the system

## 🚀 Step-by-Step Testing Instructions

---

### **STEP 1: Upload a Contract (if needed)**

**Goal**: Have a contract in the system to test with

1. **Navigate to**: Dashboard → "Upload Contract" button (top right)
2. **Upload**: Any contract PDF (you can use the existing Plant Variety License contract)
3. **Wait**: For AI analysis to complete (~30 seconds)
4. **Verify**: Contract appears in dashboard with "Analyzed" status ✅

**Expected Result**: Contract successfully uploaded and analyzed

---

### **STEP 2: Enable ERP Matching on the Contract**

**Goal**: Turn on the ERP semantic matching feature for this contract

1. **Navigate to**: Dashboard → Click on your contract card
2. **Scroll down** to section: **"ERP Data Matching Configuration"**
3. **Find the toggle switch** labeled: "Traditional Sales Upload"
4. **Click the toggle** to turn it ON (purple)
5. **Verify**: Label changes to "✅ ERP Semantic Matching Enabled"
6. **Read description**: Should say "Sales will be matched against imported ERP records..."

**Expected Result**: 
- ✅ Toggle is ON (purple color)
- ✅ Success toast message appears
- ✅ Description text updates

**Screenshot Location**: Contract Analysis page, ERP Data Matching Configuration section

---

### **STEP 3: Import ERP Master Data**

**Goal**: Import product master data that sales will be matched against

1. **Navigate to**: Sidebar → **"ERP Data Import"** (💾 database icon)
2. **Select Contract**: Choose the contract you just enabled ERP matching for
3. **Skip mapping** for now (mapping is optional for testing)
4. **Upload File**: Click "Choose File" and select `erp_master_data_sample.csv`
5. **Click**: "Start Import" button
6. **Watch Progress**: 
   - Status shows "Processing..."
   - Progress bar shows "Processing 10 of 15 records"
   - Page auto-refreshes every 2 seconds
7. **Wait**: Until status shows "Completed" (takes ~30-60 seconds for 15 records)

**Expected Result**:
- ✅ Import job appears in history table
- ✅ Status: "Completed" with green badge
- ✅ Records processed: 15
- ✅ Progress: 100%

**What's Happening Behind the Scenes**:
- AI is generating 384-dimensional vector embeddings for each product
- Embeddings are stored in PostgreSQL with pgvector
- This allows semantic similarity search later

---

### **STEP 4: Upload Sales Data with Semantic Matching**

**Goal**: Upload sales transactions and watch AI match them to ERP products

1. **Navigate to**: Sidebar → **"Sales Data"**
2. **Notice the purple banner**: "🔮 ERP Semantic Matching Active"
   - This confirms the contract has ERP matching enabled
3. **Select Contract**: Choose the same contract from dropdown
4. **Upload File**: Click "Choose File" and select `sales_data_sample.csv`
5. **Click**: "Upload & Process" button
6. **Wait**: Processing takes ~30-60 seconds (AI generates embeddings and matches)

**Expected Result - Upload Results Card**:

```
📊 Upload Results
━━━━━━━━━━━━━━━━━━━━━━━━
Total Rows: 15
Valid: 15
Errors: 0

🔮 ERP Semantic Matching Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Matched: 15          (≥70% confidence)
⚠️ Unmatched: 0         (<70% confidence)
📊 Avg Confidence: 95%  (AI-powered)

💡 Sales records were matched against imported 
   ERP master data using semantic similarity search
```

**Why High Confidence?**
The sample data is designed with matching:
- Product codes: MAPLE-001, ROSE-001, etc. (exact matches)
- Product names: "Aurora Flame Maple" (exact matches)
- Categories: "Ornamental Trees", "Flowering Shrubs" (exact matches)
- Territories: "Primary", "Secondary" (exact matches)

This creates very high semantic similarity (90-100% confidence)

---

### **STEP 5: Verify Results in Database**

**Goal**: Confirm data was stored with confidence scores

1. **Navigate to**: Sidebar → **"Royalty Dashboard"** 
2. **Select**: Your contract
3. **View Sales Data**: You should see all 15 transactions
4. **Check Confidence Scores**: Each record should show match confidence
   - Look for records with ~90-100% confidence
   - All should be marked as "matched"

**Expected Result**:
- ✅ All 15 sales transactions visible
- ✅ Each has a confidence score stored
- ✅ Ready for royalty calculations

---

### **STEP 6: Compare with Traditional Upload (Optional)**

**Goal**: See the difference when ERP matching is OFF

1. **Go back** to Contract Analysis page
2. **Toggle OFF** the ERP matching switch
3. **Upload** the same sales CSV again
4. **Notice**: No semantic matching results shown
5. **Result**: Direct upload without AI analysis

This demonstrates the hybrid approach - you can choose per contract!

---

## 📊 Expected Matching Results Breakdown

Based on the sample data, here's what you should see:

| Product | Expected Confidence | Reason |
|---------|-------------------|---------|
| Aurora Flame Maple | 98-100% | Exact code & name match |
| Crimson King Maple | 95-98% | Exact code & name match |
| Golden Spire Juniper | 98-100% | Exact code & name match |
| Pacific Sunset Rose | 98-100% | Exact code & name match |
| All 15 products | 90-100% | High semantic similarity |

**Match Distribution**:
- **High Confidence (90-100%)**: 15 records
- **Medium Confidence (70-89%)**: 0 records
- **Low Confidence (<70%)**: 0 records

---

## 🔍 Troubleshooting

### Issue: "No contracts found with ERP matching enabled"
**Solution**: Make sure you toggled the switch ON in Step 2

### Issue: ERP import stays in "Processing" status
**Solution**: 
- Wait 2 minutes (AI embeddings take time)
- Check browser console for errors
- Refresh the page

### Issue: Sales upload shows 0% confidence
**Solution**: 
- Verify ERP data was imported first (Step 3)
- Check that product codes/names match between files
- Ensure contract has ERP matching enabled

### Issue: Upload fails with error
**Solution**: 
- Check CSV file format (must have required columns)
- Verify contract ID is correct
- Check server logs for details

---

## 🎯 Success Criteria Checklist

✅ Contract uploaded and analyzed
✅ ERP matching toggle enabled (purple switch ON)
✅ ERP master data imported (15 records, status: Completed)
✅ Sales data uploaded with semantic matching
✅ Results show:
  - All 15 transactions processed
  - High match confidence (90-100%)
  - 15 matched, 0 unmatched
  - Average confidence ~95%+
✅ Data visible in Royalty Dashboard
✅ Match confidence scores stored in database

---

## 📈 What's Next?

After successful testing:
1. **Use your own data**: Replace sample files with real ERP and sales data
2. **Configure mappings**: Set up ERP field mappings for your system (Oracle, SAP, etc.)
3. **Run calculations**: Use the Royalty Calculator with matched sales data
4. **Monitor accuracy**: Check confidence scores to validate matching quality
5. **Adjust threshold**: If needed, modify the 70% confidence threshold

---

## 📝 Notes

- **Processing Time**: ~2-4 seconds per record for embedding generation
- **Confidence Threshold**: 70% is the default for "matched" vs "unmatched"
- **Storage**: All data stored in PostgreSQL with pgvector extension
- **AI Model**: HuggingFace BAAI/bge-small-en-v1.5 (100% free)
- **Embedding Dimensions**: 384 (industry-standard for semantic search)

---

## 🆘 Need Help?

If something doesn't work:
1. Check the browser console (F12) for errors
2. Check server logs in the workflow output
3. Verify all files are in CSV format with correct columns
4. Make sure the contract has ERP matching enabled
5. Confirm ERP data import completed before sales upload

---

**Happy Testing! 🚀**
