import csv
import json
import os

def convert(csvFilePath: str, jsonFilePath: str) -> None:
     
    data = {}
     
    with open(csvFilePath, encoding='utf-8') as csvf:
        csvReader = csv.DictReader(csvf)
        for rows in csvReader:
            # 'ID' column is the primary key
            key = rows['ID']
            data[key] = rows
 
    with open(jsonFilePath, 'w', encoding='utf-8') as jsonf:
        jsonf.write(json.dumps(data, indent=4))
         
 
csvFilePath = os.path.join("rawData", "activities.csv")
jsonFilePath = r'activities2.json'
 
convert(csvFilePath, jsonFilePath)