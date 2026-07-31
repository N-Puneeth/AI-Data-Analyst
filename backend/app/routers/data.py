from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
import numpy as np
import io

router = APIRouter(prefix="/data", tags=["Data Processing"]) # adjust prefix if your main.py maps it differently, usually it is just "/data" if main.py adds "/api"

@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Only CSV or Excel files are allowed.")
    
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents)) if file.filename.endswith('.csv') else pd.read_excel(io.BytesIO(contents))
        df = df.dropna(how='all')
        
        num_cols = df.select_dtypes(include=['number']).columns.tolist()
        cat_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
        
        # Smart Target Identification (Defaults to Sales/Target or the last numeric column)
        target_candidates = ['survived', 'price', 'cost', 'bill', 'target', 'sales', 'value', 'status', 'revenue']
        target_col = next((col for col in df.columns if any(cand in col.lower() for cand in target_candidates)), num_cols[-1] if num_cols else None)

        # Missing Data Analysis
        missing_data = ((df.isnull().sum() / len(df)) * 100).round(2)
        missing_dict = missing_data[missing_data > 0].sort_values(ascending=False).to_dict()

        calculated_metrics = {
            "total_rows": len(df),
            "total_columns": len(df.columns),
            "missing_data": missing_dict,
            "numeric_columns": num_cols,
            "categorical_columns": cat_cols,
            "target": {"Target Variable": target_col, "Target Mean": round(df[target_col].mean(), 2)} if target_col and target_col in num_cols else {}
        }

        # --- DYNAMIC VISUALIZATIONS ---
        visualizations = []
        
        # 1. Categorical Bar Charts (If categories exist)
        if cat_cols and target_col in num_cols:
            c1_data = df.groupby(cat_cols[0])[target_col].mean().dropna().head(5)
            visualizations.append({
                "type": "bar", "title": f"Avg {target_col} by {cat_cols[0]}",
                "data": [{"name": str(k), "value": float(v)} for k, v in c1_data.items()]
            })
            
        # 2. Numeric Correlation Chart (Crucial for advertising.csv!)
        elif len(num_cols) > 1 and target_col:
            correlations = df[num_cols].corr()[target_col].drop(target_col).fillna(0)
            top_corr = correlations.abs().nlargest(4).index
            visualizations.append({
                "type": "bar_horizontal", "title": f"Impact on {target_col} (Correlation)",
                "data": [{"name": str(col), "value": round(float(correlations[col]), 3)} for col in top_corr]
            })

        # 3. Distribution Area Chart
        if len(num_cols) > 0:
            hist_col = target_col if target_col in num_cols else num_cols[0]
            counts, bins = np.histogram(df[hist_col].dropna(), bins=10)
            visualizations.append({
                "type": "area", "title": f"{hist_col} Distribution",
                "data": [{"name": f"{round(bins[i],1)}", "value": int(counts[i])} for i in range(len(counts))]
            })
            
        # 4. Scatter/Trend Plot for purely numeric files
        if len(num_cols) > 1 and not cat_cols and target_col:
            feature_col = [c for c in num_cols if c != target_col][0]
            sampled_df = df[[feature_col, target_col]].dropna().sort_values(by=feature_col).sample(min(30, len(df))).sort_values(by=feature_col)
            visualizations.append({
                "type": "scatter_line", "title": f"{target_col} vs {feature_col}",
                "data": [{"name": str(round(row[feature_col], 1)), "value": float(row[target_col])} for _, row in sampled_df.iterrows()]
            })

        summary = {
            "filename": file.filename,
            "preview": df.head(3).to_dict(orient="records"),
            "calculated_metrics": calculated_metrics,
            "visualizations": visualizations
        }
        return {"message": "Processed successfully!", "summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Data Error: {str(e)}")