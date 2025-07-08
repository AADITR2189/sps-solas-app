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

history = []  # to store past reports

# Rule definitions with explanation, reference link, and optional review condition note
rules_info = {
    "SPS 2.2.3": ("Stability treated as cargo ship", "https://www.imo.org/en/OurWork/Safety/Pages/SpecialPurposeShips.aspx", "Review if special personnel > 60; may need to treat as passenger ship"),
    "SOLAS II-1/29.6.1.2": ("Auxiliary steering gear for ships ≤240 persons.", "https://www.imo.org/en/OurWork/Safety/Pages/SOLAS.aspx", "Review if vessel may exceed 240 personnel or lacks verified capacity"),
    "SOLAS II-1/29.6.1.1": ("Main steering gear for ships >240 persons.", "https://www.imo.org/en/OurWork/Safety/Pages/SOLAS.aspx", "Review if gear not confirmed for >240 personnel"),
    "SOLAS III": ("Life-saving appliances appropriate to personnel type.", "https://www.imo.org/en/OurWork/Safety/Pages/Life-Saving-Appliances.aspx", "Review for SPS vessels transitioning to >60 persons"),
    "SOLAS IV": ("GMDSS radio compliance for safety communication.", "https://www.imo.org/en/OurWork/Safety/Pages/Radio-Communications.aspx", ""),
    "SOLAS XI-2": ("Security plan for ship safety under ISPS Code.", "https://www.imo.org/en/OurWork/Security/Pages/SOLAS-XI-2.aspx", "Review if security measures in progress or partially implemented"),
    "SOLAS II-2": ("Fire protection systems compliance for vessel type.", "https://www.imo.org/en/OurWork/Safety/Pages/FireSafety.aspx", ""),
    "SOLAS II-1/19": ("Emergency electrical power supply standards.", "https://www.imo.org/en/OurWork/Safety/Pages/SOLAS.aspx", "Review if backup duration or independence not fully confirmed")
}

def export_to_word(scenario, df):
    doc = Document()

    # Branding and title
    doc.add_heading("SPS–SOLAS Gap Analysis Report", 0)
    doc.add_paragraph(f"Scenario: {scenario}").paragraph_format.space_after = Pt(12)

    # Summary
    summary = generate_summary(df)
    doc.add_paragraph("Summary:").runs[0].bold = True
    doc.add_paragraph(summary)

    # Rule Table
    doc.add_paragraph("\nDetailed Compliance Table:").runs[0].bold = True
    table = doc.add_table(rows=1, cols=4)
    table.style = 'Table Grid'
    hdr_cells = table.rows[0].cells
    hdr_cells[0].text = 'Rule Regulation Number'
    hdr_cells[1].text = 'Description of Rule'
    hdr_cells[2].text = 'Compliance or Not'
    hdr_cells[3].text = 'Reference'

    for _, row in df.iterrows():
        row_cells = table.add_row().cells
        row_cells[0].text = row['Rule Regulation Number']
        row_cells[1].text = row['Description of Rule']
        row_cells[2].text = row['Compliance or Not']
        row_cells[3].text = row['Regulatory Reference']

    doc.add_page_break()

    word_path = f"gap_analysis_{scenario.replace(' ', '_')}.docx"
    doc.save(word_path)
    with open(word_path, "rb") as file:
        st.download_button("📝 Download Word Report", file, file_name=word_path)
