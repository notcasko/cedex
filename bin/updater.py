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

def main():
    existing_data, known_ids, last_known_id = load_existing_bonds()
    all_ces = fetch_all_ces()
    new_ce_ids = find_new_bond_ces(all_ces, known_ids, last_known_id)
    
    if not new_ce_ids:
        print("Update complete. No changes made.")
        return

    new_entries = []
    for ce_id in new_ce_ids:
        owner_info = get_owner_data(ce_id)
        if owner_info:

            # -- find chocolate ce for this owner --
            choco_id = get_choco_id_for_servant(owner_info["id"], all_ces)
            entry = {
                "id": ce_id,
                "owner": owner_info["name"],
                "face": owner_info["face"]
            }

            # find chocolate CE via owner id
            choco_id = get_choco_id_for_servant(owner_info["id"], all_ces)
            if choco_id:
                entry["choco_id"] = choco_id

            new_entries.append(entry)
            print(f"Processed: {owner_info['name']} (Choco CE: {choco_id})")

        time.sleep(0.5)
        
    if new_entries:
        existing_data.extend(new_entries)
        with open(BOND_JSON_PATH, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, indent=2, ensure_ascii=False)
        print(f"Added {len(new_entries)} new entries.")

if __name__ == "__main__":
    main()