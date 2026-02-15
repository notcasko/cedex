import requests
import json
import os
import time

# --- Configuration ---
SCRIPT_DIR = os.path.dirname(os.path.realpath(__file__))
BOND_JSON_PATH = os.path.join(SCRIPT_DIR, '..', 'src', 'data', 'bond_ces.json')

ALL_CES_URL = "https://api.atlasacademy.io/export/JP/basic_equip_lang_en.json"
CE_API_URL = "https://api.atlasacademy.io/nice/JP/equip/{}"
SERVANT_EXPORT_URL = "https://api.atlasacademy.io/export/JP/basic_servant_lang_en.json"
SERVANT_EXPORT_CACHE = "basic_servant_lang_en.json"
SERVANT_EXPORT_TTL = 60 * 60 * 24

# --- Logic ---

def ensure_servant_export(force_refresh=False):
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
            if not os.path.exists(SERVANT_EXPORT_CACHE):
                raise

    with open(SERVANT_EXPORT_CACHE, "r", encoding="utf-8") as fh:
        data = json.load(fh)

    # UPDATED: Now stores a dict with name and face
    id_to_data = {}
    for item in data:
        s_id = item.get("id")
        if s_id is not None:
            id_to_data[int(s_id)] = {
                "name": item.get("name"),
                "face": item.get("face") # This is the face URL from the export
            }
    return id_to_data

_SERVANT_MAP = None
def get_servant_map(force_refresh=False):
    global _SERVANT_MAP
    if _SERVANT_MAP is None or force_refresh:
        _SERVANT_MAP = ensure_servant_export(force_refresh=force_refresh)
    return _SERVANT_MAP

def load_existing_bonds():
    try:
        with open(BOND_JSON_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if not data: return [], set(), 0
            known_ids = {item.get('id') for item in data}
            last_known_id = data[-1].get('id', 0) if data else 0
            return data, known_ids, last_known_id
    except (FileNotFoundError, json.JSONDecodeError):
        return [], set(), 0

def fetch_all_ces():
    response = requests.get(ALL_CES_URL)
    response.raise_for_status()
    return response.json()

def find_new_bond_ces(all_ces, known_ids, last_known_id):
    bond_ces = [ce for ce in all_ces if ce.get('flag') == 'svtEquipFriendShip']
    bond_ces.sort(key=lambda x: x.get('collectionNo', 0))
    
    new_ces = []
    for ce in bond_ces:
        ce_id = ce.get('collectionNo')
        if ce_id > last_known_id and ce_id not in known_ids:
            new_ces.append(ce_id)
    return new_ces

def get_choco_id_for_servant(servant_collection_no, all_ces):
    """
    Search through all ces to find the valentine equip with matching owner,
    return its ID (collectionNo) if found.
    """
    for ce in all_ces:
        if ce.get('flag') == 'svtEquipChocolate':
            owner = ce.get('valentineEquipOwner')
            if owner == servant_collection_no:
                return ce.get('collectionNo')
    return None

def get_owner_data(ce_id):
    """Returns dict containing servant id, name, face."""
    api_url = CE_API_URL.format(ce_id)
    try:
        resp = requests.get(api_url, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"ERROR: {e}")
        return None

    owner_field = data.get("bondEquipOwner")
    if owner_field is None:
        return None

    owner_id = None
    if isinstance(owner_field, dict):
        owner_id = owner_field.get("id") or owner_field.get("collectionNo")
    elif isinstance(owner_field, (int, str)):
        owner_id = int(owner_field)

    if owner_id:
        servant_map = get_servant_map()
        s_data = servant_map.get(owner_id)
        if s_data:
            return {
                "id": owner_id,       # <-- add this line
                "name": s_data["name"],
                "face": s_data["face"]
            }

    return None

def build_valentine_map(all_ces):
    """Creates a mapping of Servant ID -> Valentine CE ID."""
    val_map = {}
    for ce in all_ces:
        if ce.get('flag') == 'svtEquipChocolate':
            owner_id = ce.get('valentineEquipOwner')
            if owner_id:
                val_map[owner_id] = ce.get('collectionNo')
    return val_map

def main():
    existing_data, known_ids, last_known_id = load_existing_bonds()
    all_ces = fetch_all_ces()
    valentine_map = build_valentine_map(all_ces)
    
    updated_count = 0
    
    # --- Part 1: Check existing entries for missing Valentines ---
    print("Checking existing entries for missing Valentines...")
    for entry in existing_data:
        if "choco_id" not in entry:
            # We need the owner_id. If we didn't save it before, 
            # we have to fetch it once via the API.
            owner_info = get_owner_data(entry["id"])
            if owner_info:
                # Store the ID in the entry for future use
                entry["owner_id"] = owner_info["id"] 
                
                choco_id = valentine_map.get(owner_info["id"])
                if choco_id:
                    entry["choco_id"] = choco_id
                    print(f"Fixed: Found missing Valentine for {entry['owner']}")
                    updated_count += 1
            time.sleep(0.2) # Avoid rate limiting

    # --- Part 2: Find entirely new servants/Bond CEs ---
    new_ce_ids = find_new_bond_ces(all_ces, known_ids, last_known_id)
    new_entries = []
    
    if new_ce_ids:
        print(f"Processing {len(new_ce_ids)} new servants...")
        for ce_id in new_ce_ids:
            owner_info = get_owner_data(ce_id)
            if owner_info:
                choco_id = valentine_map.get(owner_info["id"])
                entry = {
                    "id": ce_id,
                    "owner_id": owner_info["id"], # Store this!
                    "owner": owner_info["name"],
                    "face": owner_info["face"]
                }
                if choco_id:
                    entry["choco_id"] = choco_id
                
                new_entries.append(entry)
                print(f"Added: {owner_info['name']}")
            time.sleep(0.5)

    # --- Part 3: Save results ---
    if new_entries or updated_count > 0:
        existing_data.extend(new_entries)
        # Sort by Bond CE ID to keep the file clean
        existing_data.sort(key=lambda x: x.get('id', 0))
        
        with open(BOND_JSON_PATH, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, indent=2, ensure_ascii=False)
        print(f"Done! Updated {updated_count} old entries and added {len(new_entries)} new ones.")
    else:
        print("No updates found.")

if __name__ == "__main__":
    main()