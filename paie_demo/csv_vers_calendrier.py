"""Convertit l'export CSV (séparateur « ; », encodage Windows) de l'onglet CALENDRIER en classeur xlsx lisible par generer_demo_paie.py.
Usage : python3 -I csv_vers_calendrier.py <export.csv> <calendrier.xlsx>"""
import csv,sys,openpyxl
rows=list(csv.reader(open(sys.argv[1],encoding='cp1252',newline=''),delimiter=';'))
wb=openpyxl.Workbook();ws=wb.active;ws.title='CALENDRIER'
for i,r in enumerate(rows,1):
    for j,v in enumerate(r,1):
        if v!='':ws.cell(i,j,v)
wb.save(sys.argv[2])
