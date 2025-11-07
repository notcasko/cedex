import requests
import json
import os
import time
from bs4 import BeautifulSoup

# --- Configuration ---

# Path to your bond_ces.json file.
# Assumes this script is in `bin/` and the data is in `src/data/`
SCRIPT_DIR = os.path.dirname(os.path.realpath(__file__))
BOND_JSON_PATH = os.path.join(SCRIPT_DIR, '..', 'src', 'data', 'bond_ces.json')

# URLs for fetching data
ALL_CES_URL = "https://api.atlasacademy.io/export/JP/basic_equip_lang_en.json"
CE_PAGE_BASE_URL = "https://apps.atlasacademy.io/db/JP/craft-essence/"
CE_API_URL = "https://api.atlasacademy.io/nice/JP/equip/{}"
SERVANT_EXPORT_URL = "https://api.atlasacademy.io/export/JP/basic_servant_lang_en.json"
SERVANT_EXPORT_CACHE = "bin/basic_servant_lang_en.json"
SERVANT_EXPORT_TTL = 60 * 60 * 24

# --- End Configuration ---
def ensure_servant_export(force_refresh=False):
    """
    Ensure the export JSON is present and fresh. Returns a dict mapping servant id -> name.
    Caches to SERVANT_EXPORT_CACHE in working directory.
    """
    def cache_is_fresh(path):
        try:
            m = os.path.getmtime(path)
            return (time.time() - m) < SERVANT_EXPORT_TTL
        except OSError:
            return False

    if force_refresh or not cache_is_fresh(SERVANT_EXPORT_CACHE):
        try:
            resp = requests.get(SERVANT_EXPORT_URL, stream=True, timeout=30)
            resp.raise_for_status()
            with open(SERVANT_EXPORT_CACHE + ".tmp", "wb") as fh:
                for chunk in resp.iter_content(chunk_size=1 << 16):
                    if chunk:
                        fh.write(chunk)
            os.replace(SERVANT_EXPORT_CACHE + ".tmp", SERVANT_EXPORT_CACHE)
        except Exception:
            # if download fails but cache exists, proceed with existing file
            if not os.path.exists(SERVANT_EXPORT_CACHE):
                raise

    with open(SERVANT_EXPORT_CACHE, "r", encoding="utf-8") as fh:
        data = json.load(fh)

    # build map id -> name (fast lookup)
    id_to_name = {int(item.get("id")): item.get("name") for item in data if "id" in item}
    return id_to_name

# Load once at module import (lazy load if you prefer)
_SERVANT_MAP = None
def get_servant_map(force_refresh=False):
    global _SERVANT_MAP
    if _SERVANT_MAP is None or force_refresh:
        _SERVANT_MAP = ensure_servant_export(force_refresh=force_refresh)
    return _SERVANT_MAP

def load_existing_bonds():
    """Loads the existing bond CE data from the JSON file."""
    try:
        with open(BOND_JSON_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if not data:
                return [], 0
            
            # Get the ID (collectionNo) of the last entry
            last_known_id = data[-1].get('id', 0)
            known_ids = {item.get('id') for item in data}
            print(f"Loaded {len(data)} existing bond CEs. Last known ID: {last_known_id}")
            return data, known_ids, last_known_id
    except FileNotFoundError:
        print("bond_ces.json not found. Will create a new one.")
        return [], set(), 0
    except json.JSONDecodeError:
        print("Error reading bond_ces.json. File might be corrupt.")
        exit(1)

def fetch_all_ces():
    """Fetches the complete CE list from Atlas Academy API."""
    print(f"Fetching complete CE list from {ALL_CES_URL}...")
    try:
        response = requests.get(ALL_CES_URL)
        response.raise_for_status()  # Raise an error for bad responses
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching CE list: {e}")
        exit(1)

def find_new_bond_ces(all_ces, known_ids, last_known_id):
    """Filters the CE list for Bond CEs and finds new ones."""
    bond_ces = []
    for ce in all_ces:
        # Check if it's a Bond CE
        if ce.get('flag') == 'svtEquipFriendShip':
            bond_ces.append(ce)
            
    # Sort by collectionNo to ensure correct order
    bond_ces.sort(key=lambda x: x.get('collectionNo', 0))
    
    new_ces = []
    for ce in bond_ces:
        ce_id = ce.get('collectionNo')
        # Check if it's newer than our last known ID and not already known
        if ce_id > last_known_id and ce_id not in known_ids:
            new_ces.append(ce_id)
            
    if new_ces:
        print(f"Found {len(new_ces)} new Bond CEs to process: {new_ces}")
    else:
        print("No new Bond CEs found.")
        
    return new_ces

def scrape_owner_name(ce_id):
    """
    Return the Bond CE owner name for CE id `ce_id`.
    Uses CE API to get bondEquipOwner (expected int) then looks up name from export JSON.
    Returns string name or None if not found.
    """
    api_url = CE_API_URL.format(ce_id)
    try:
        resp = requests.get(api_url, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"ERROR: failed to fetch CE {ce_id}: {e}")
        return None

    owner_field = data.get("bondEquipOwner")
    # Cases:
    #  - None -> not a bond CE or no owner
    #  - int  -> servant id (expected)
    #  - dict -> embedded object (may have "id" or "name")
    if owner_field is None:
        return None

    # If API returned dict with name embedded
    if isinstance(owner_field, dict):
        # prefer name if present
        if "name" in owner_field and owner_field["name"]:
            return owner_field["name"]
        # otherwise try id inside dict
        owner_id = owner_field.get("id") or owner_field.get("collectionNo") or owner_field.get("servantId")
        if owner_id:
            owner_field = int(owner_id)
        else:
            return None

    # If we reach here, owner_field should be an integer id
    if isinstance(owner_field, (int, str)):
        try:
            owner_id = int(owner_field)
        except Exception:
            return None
        servant_map = get_servant_map()
        name = servant_map.get(owner_id)
        return name

    return None

def main():
    existing_data, known_ids, last_known_id = load_existing_bonds()
    all_ces = fetch_all_ces()
    new_ce_ids = find_new_bond_ces(all_ces, known_ids, last_known_id)
    
    if not new_ce_ids:
        print("Update complete. No changes made.")
        return

    new_entries = []
    for ce_id in new_ce_ids:
        owner = scrape_owner_name(ce_id)
        if owner:
            new_entries.append({
                "id": ce_id,
                "owner": owner
            })
        # Be polite to the server
        time.sleep(0.5)
        
    if new_entries:
        # Append new entries to the existing data
        existing_data.extend(new_entries)
        
        # Write the updated data back to the file
        try:
            with open(BOND_JSON_PATH, 'w', encoding='utf-8') as f:
                json.dump(existing_data, f, indent=2, ensure_ascii=False)
            print(f"\nSuccessfully added {len(new_entries)} new Bond CEs to {BOND_JSON_PATH}")
        except IOError as e:
            print(f"Error writing to file {BOND_JSON_PATH}: {e}")
    else:
        print("\nFinished, but no new entries were successfully added (scrape may have failed).")

if __name__ == "__main__":
    main()