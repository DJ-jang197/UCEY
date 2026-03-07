import xml.etree.ElementTree as ET
import csv
import collections

from typing import Dict, Tuple

# We will count occurrences: (Province, Municipality, Site_Name, Latitude, Longitude, Medium, Contamination) -> count
data: Dict[Tuple[str, str, str, str, str, str, str], int] = {}

xml_file = 'fcsi-rscf.xml'

try:
    context = ET.iterparse(xml_file, events=('end',))
    print("Parsing XML in progress...")
    for event, elem in context:
        if elem.tag == 'Site':
            # Find site name
            name_elem = elem.find('Name')
            site_name = "Unknown"
            if name_elem is not None:
                en_elem = name_elem.find('EN')
                if en_elem is not None and en_elem.text is not None:
                    site_name = str(en_elem.text).strip()

            # Find location
            location = elem.find('Location')
            province = "Unknown"
            municipality = "Unknown"
            latitude = "Unknown"
            longitude = "Unknown"
            
            if location is not None:
                prov_elem = location.find('Province')
                mun_elem = location.find('Municipality')
                lat_elem = location.find('Latitude')
                lng_elem = location.find('Longitude')
                
                if prov_elem is not None and prov_elem.text is not None: province = str(prov_elem.text).strip()
                if mun_elem is not None and mun_elem.text is not None: municipality = str(mun_elem.text).strip()
                if lat_elem is not None and lat_elem.text is not None: latitude = str(lat_elem.text).strip()
                if lng_elem is not None and lng_elem.text is not None: longitude = str(lng_elem.text).strip()
            
            # Find Contamination Details
            contam_details = elem.find('ContaminationDetails')
            if contam_details is not None:
                for media in contam_details.findall('ContaminatedMedia'):
                    contam = media.find('Contamination')
                    medium = media.find('Medium')
                    
                    contam_name = "Unknown"
                    medium_name = "Unknown"
                    
                    if contam is not None:
                        # Find the EN tag
                        en_elem = contam.find('EN')
                        if en_elem is not None and en_elem.text is not None: 
                            contam_name = str(en_elem.text).strip()
                    
                    if medium is not None:
                        en_elem = medium.find('EN')
                        if en_elem is not None and en_elem.text is not None: 
                            medium_name = str(en_elem.text).strip()
                    
                    # Filter for specific major cities
                    target_cities = ['montreal', 'toronto', 'vancouver', 'ottawa']
                    if str(municipality).lower() not in target_cities and "montréal" not in str(municipality).lower():
                        continue
                        
                    # Store records
                    key = (province, municipality, site_name, latitude, longitude, medium_name, contam_name)
                    data[key] = data.get(key, 0) + 1
                    
            # To save memory, clear the element after processing
            elem.clear()

    print(f"Finished parsing. Found {len(data)} unique combinations.")
    
    csv_file = 'contamination_summary.csv'
    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Province', 'Municipality', 'Site_Name', 'Latitude', 'Longitude', 'Medium', 'Contamination_Type', 'Site_Count'])
        for k, v in sorted(data.items()):
            writer.writerow([k[0], k[1], k[2], k[3], k[4], k[5], k[6], v])
    print(f"Data saved to {csv_file}")

except Exception as e:
    print(f"Error parsing XML: {e}")
