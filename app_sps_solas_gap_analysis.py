import pandas as pd
import streamlit as st
from datetime import datetime
import os
from fpdf import FPDF
from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

# ---------------------------
# INTRO SCREEN FOR FIRST TIME USERS
# ---------------------------
st.title("🚢 SPS–SOLAS Gap Analysis Tool")
st.markdown("""
Welcome to the **SPS–SOLAS Gap Analysis Tool**! 👋

This tool helps you evaluate the regulatory requirements when converting a vessel:
- From **cargo to SPS** with less or more than 60 special personnel
- From **SPS < 60 to SPS > 60**

### 📋 How to Use:
1. Use the **sidebar** to enter vessel info like GT, personnel, systems installed
2. Click **Run Gap Analysis**
3. View your compliance table and **download** Word/CSV reports

---
**Start by filling out the sidebar on the left ➡️**
""")